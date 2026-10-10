import sequelize from "../../config/db-connection";
import { VerificationModel } from "../../models/livestock/verification.model";
import { FileController } from "../global/file.controller";
import { InventoryController } from "../inventory/inventory.controller";
import { RegistrationController } from "./registration.controller";
import { WeighingController } from "./weighing.controller";
import {
  isPreButchered,
  REGISTRATION_STATUS,
} from "../../types/livestock/registration.type";
import { MOVEMENT_SOURCE } from "../../types/inventory/inventory.type";
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
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(
      doc.registrationId,
      context,
    );
    if (isPreButchered(reg))
      throw new Error("Үйлдвэр 2-т баталгаажуулалт хийгдэхгүй");
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
    // ingestFromRegistration). No Settlement needs to exist yet.
    const meatLines = await WeighingController.meatStockLines(
      doc.registrationId,
      reg.factory,
    );

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

      await InventoryController.ingestFromRegistration(
        doc.registrationId,
        MOVEMENT_SOURCE.VERIFICATION,
        meatLines,
        t,
      );

      return verification;
    });
  }
}
