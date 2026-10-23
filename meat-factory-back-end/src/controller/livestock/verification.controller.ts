import sequelize from "../../config/db-connection";
import { AdminController } from "../user/admin.controller";
import { PERMISSION } from "../../types/user/permission.type";
import { FactoryController } from "../factory/factory.controller";
import { VerificationModel } from "../../models/livestock/verification.model";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { FileController } from "../global/file.controller";
import { InventoryController } from "../inventory/inventory.controller";
import { RegistrationController } from "./registration.controller";
import { WeighingController } from "./weighing.controller";
import {
  REGISTRATION_STATUS,
} from "../../types/livestock/registration.type";
import { MOVEMENT_SOURCE } from "../../types/inventory/inventory.type";
import { TVerifyInput } from "../../types/livestock/verification.type";
import { TContext } from "../../types/global/global.type";

// Verification (Баталгаажуулалт — single signer). One authorised staff member
// (нярав / нягтлан / админ) confirms and signs. Shared status/role guards and
// registration lookups live on RegistrationController.
export class VerificationController {
  // Manual eBarimt record while the PosAPI flow (EbarimtController) is
  // parked: at verification the нярав enters the receipt on the herder's
  // phone — optional, not every herder agrees — and records it with a photo
  // and a note. Every save overwrites all three; open until cancelled.
  static async setEbarimtCheck(
    registrationId: string,
    taken: boolean,
    imageFileId: string | null,
    note: string | null,
    context: TContext,
  ): Promise<RegistrationModel> {
    AdminController.assertPermission(context, PERMISSION.REGISTRATION_VERIFY);

    const reg = await RegistrationController.findIdCheck(
      registrationId,
      context,
    );
    if (reg.status === REGISTRATION_STATUS.CANCELLED)
      throw new Error("Цуцлагдсан бүртгэл");

    if (imageFileId) await FileController.findIdCheck(imageFileId);
    await reg.update({
      ebarimtTaken: taken,
      ebarimtImageFileId: imageFileId,
      ebarimtNote: note?.trim() || null,
    });
    return RegistrationController.getById(registrationId, context);
  }

  static async verify(
    doc: TVerifyInput,
    context: TContext,
  ): Promise<VerificationModel> {
    AdminController.assertPermission(context, PERMISSION.REGISTRATION_VERIFY);

    const reg = await RegistrationController.findIdCheck(
      doc.registrationId,
      context,
    );
    if (FactoryController.isPreButchered(reg.factory))
      throw new Error("Задалсан мах хүлээн авах үйлдвэрт баталгаажуулалт хийгдэхгүй");
    RegistrationController.assertStatus(reg, [REGISTRATION_STATUS.WEIGHED]);

    // Herder consent is signed by hand on the printed weigh slip — no
    // on-screen signature required.

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
