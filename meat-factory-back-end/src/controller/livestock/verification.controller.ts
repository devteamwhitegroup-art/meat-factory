import sequelize from "../../config/db-connection";
import { VerificationModel } from "../../models/livestock/verification.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { FileController } from "../global/file.controller";
import { InventoryController } from "../inventory/inventory.controller";
import { RegistrationController } from "./registration.controller";
import { REGISTRATION_STATUS } from "../../types/livestock/registration.type";
import { TVerifyInput } from "../../types/livestock/verification.type";
import { TContext } from "../../types/global/global.type";
import { ADMIN_ROLE } from "../../types/user/admin.type";

// Verification (Баталгаажуулалт — single signer). One authorised staff member
// (нярав / нягтлан / админ) confirms and signs. Shared status/role guards and
// registration lookups live on RegistrationController.
export class VerificationController {
  static async verify(
    doc: TVerifyInput,
    context: TContext,
  ): Promise<VerificationModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.SCALE,
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(doc.registrationId);
    RegistrationController.assertStatus(reg, [REGISTRATION_STATUS.WEIGHED]);

    // The herder must have signed the weighed slip (agreeing to price/cost)
    // before we can verify.
    if (!reg.agreementSignatureFileId)
      throw new Error(
        "Малчны гарын үсэг (зөвшөөрсөн) шаардлагатай. Эхлээд гарын үсэг зурна уу.",
      );

    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    // Meat becomes factory inventory right here — slaughtered + weighed +
    // verified is "officially factory meat" regardless of when the herder
    // is actually paid (see InventoryController.
    // ingestMeatFromVerifiedRegistration). Grouped by animalId straight from
    // WeighingEntry; no Settlement needs to exist yet.
    const weighing = await WeighingEntryModel.findAll({
      where: { registrationId: doc.registrationId },
    });
    const byAnimal: Record<string, number> = {};
    for (const w of weighing)
      byAnimal[w.animalId] = (byAnimal[w.animalId] ?? 0) + Number(w.weightKg);
    const meatLines = Object.entries(byAnimal).map(([animalId, kg]) => ({
      animalId,
      quantityKg: Number(kg.toFixed(2)),
    }));

    return await sequelize.transaction(async (t) => {
      const [verification] = await VerificationModel.findOrCreate({
        where: { registrationId: doc.registrationId },
        defaults: {
          registrationId: doc.registrationId,
          notes: doc.notes ?? null,
          photoFileId: doc.photoFileId ?? null,
        },
        transaction: t,
      });

      if (doc.photoFileId && !verification.photoFileId) {
        verification.photoFileId = doc.photoFileId;
      }
      verification.firstVerifierId = context.id;
      verification.firstVerifiedAt = new Date();
      if (doc.notes) verification.notes = doc.notes;
      await verification.save({ transaction: t });

      await reg.update(
        { status: REGISTRATION_STATUS.VERIFIED },
        { transaction: t },
      );

      await InventoryController.ingestMeatFromVerifiedRegistration(
        doc.registrationId,
        meatLines,
        t,
      );

      return verification;
    });
  }

  // Verifier toggles whether the slaughter cost is offset by coverable
  // byproducts (e.g. адууны өлөн гэдэс given to the factory in lieu of
  // payment). Allowed while WEIGHED (during verify) or VERIFIED (post-sign
  // adjustment before settlement).
  static async setSlaughterCovered(
    registrationId: string,
    covered: boolean,
    context: TContext,
  ): Promise<VerificationModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN,
      ADMIN_ROLE.SCALE,
    ]);
    const reg = await RegistrationController.findIdCheck(registrationId);
    // Cover toggling is allowed up until the settlement is created — at
    // PAYMENT_PENDING the amounts are locked.
    RegistrationController.assertStatus(reg, [
      REGISTRATION_STATUS.WEIGHED,
      REGISTRATION_STATUS.VERIFIED,
    ]);
    const [v] = await VerificationModel.findOrCreate({
      where: { registrationId },
      defaults: {
        registrationId,
        slaughterCoveredByByproduct: !!covered,
      },
    });
    v.slaughterCoveredByByproduct = !!covered;
    await v.save();
    return v;
  }
}
