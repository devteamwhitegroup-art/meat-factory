import { VerificationModel } from "../../models/livestock/verification.model";
import { FileController } from "../global/file.controller";
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

    const [verification] = await VerificationModel.findOrCreate({
      where: { registrationId: doc.registrationId },
      defaults: {
        registrationId: doc.registrationId,
        notes: doc.notes ?? null,
        photoFileId: doc.photoFileId ?? null,
      },
    });

    if (doc.photoFileId && !verification.photoFileId) {
      verification.photoFileId = doc.photoFileId;
    }
    verification.firstVerifierId = context.id;
    verification.firstVerifiedAt = new Date();
    if (doc.notes) verification.notes = doc.notes;
    await verification.save();

    await reg.update({ status: REGISTRATION_STATUS.VERIFIED });
    return verification;
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
