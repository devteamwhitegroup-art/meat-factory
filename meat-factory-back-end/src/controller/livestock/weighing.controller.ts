import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { AnimalController } from "./animal.controller";
import { FileController } from "../global/file.controller";
import { RegistrationController } from "./registration.controller";
import { REGISTRATION_STATUS } from "../../types/livestock/registration.type";
import {
  TCreateWeighingEntry,
  TUpdateWeighingEntry,
} from "../../types/livestock/weighing-entry.type";
import { TContext } from "../../types/global/global.type";
import { ADMIN_ROLE } from "../../types/user/admin.type";

// Weighing (Хэмжүүр) — sub-domain of the registration aggregate. Shared
// status/role guards and registration lookups live on RegistrationController.
export class WeighingController {
  static async addWeighingEntry(
    doc: TCreateWeighingEntry,
    context: TContext,
  ): Promise<WeighingEntryModel> {
    // Anyone on the floor except the gate guard may weigh — cover for SCALE
    // shifts where the named operator isn't around.
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.SCALE,
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MODERATOR,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);

    const { registrationId, animalType, weightKg, pricePerKg } = doc;
    if (!weightKg || weightKg <= 0)
      throw new Error("Weight must be a positive number");
    if (pricePerKg != null && pricePerKg < 0)
      throw new Error("Price per kg cannot be negative");

    const reg = await RegistrationController.findIdCheck(registrationId);
    // Weighing happens in-place while the row is REGISTERED. No mid-state.
    RegistrationController.assertStatus(reg, [REGISTRATION_STATUS.REGISTERED]);

    // Resolve the animal by catalogue name (throws if unknown).
    const animal = await AnimalController.resolveByName(animalType);

    const line = await RegistrationAnimalLineModel.findOne({
      where: { registrationId, animalId: animal.id },
    });
    if (!line)
      throw new Error(
        `Animal type ${animalType} is not part of this registration`,
      );

    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    return await sequelize.transaction(async (t) => {
      const maxSeq: number =
        ((await WeighingEntryModel.max("sequenceNo", {
          where: { registrationId },
          transaction: t,
        })) as number | null) ?? 0;

      const entry = await WeighingEntryModel.create(
        {
          registrationId,
          animalId: animal.id,
          weightKg,
          pricePerKg: pricePerKg ?? null,
          sequenceNo: maxSeq + 1,
          scaleOperatorId: context.id,
          photoFileId: doc.photoFileId ?? null,
        },
        { transaction: t },
      );

      return entry;
    });
  }

  static async finishWeighing(
    registrationId: string,
    context: TContext,
  ): Promise<RegistrationModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.SCALE,
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MODERATOR,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(registrationId);
    // finishWeighing flips REGISTERED → WEIGHED once entries have been recorded.
    RegistrationController.assertStatus(reg, [REGISTRATION_STATUS.REGISTERED]);

    const count = await WeighingEntryModel.count({ where: { registrationId } });
    if (count === 0)
      throw new Error("Cannot finish weighing with no entries recorded");

    await reg.update({ status: REGISTRATION_STATUS.WEIGHED });
    return RegistrationController.getById(registrationId);
  }

  // Editing/removing a weighing entry. While weighing is in progress
  // (REGISTERED) the scale operator (and managers) may edit. Once weighing is
  // "fully uploaded" (finishWeighing → WEIGHED, and onwards through VERIFIED
  // / PAYMENT_PENDING) it is locked for operators — only MANAGER/ADMIN/
  // SUPER_ADMIN may edit. After SETTLED/CANCELLED the weights are frozen for
  // everyone.
  private static _assertWeighingEditable(
    reg: RegistrationModel,
    context: TContext,
  ): void {
    const privileged: ADMIN_ROLE[] = [
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN,
    ];
    if (
      reg.status === REGISTRATION_STATUS.SETTLED ||
      reg.status === REGISTRATION_STATUS.CANCELLED
    ) {
      throw new Error("Бүртгэл хаагдсан тул жинг засах боломжгүй");
    }
    const fullyUploaded =
      reg.status === REGISTRATION_STATUS.WEIGHED ||
      reg.status === REGISTRATION_STATUS.VERIFIED ||
      reg.status === REGISTRATION_STATUS.PAYMENT_PENDING;
    if (fullyUploaded) {
      if (!privileged.includes(context.role))
        throw new Error(
          "Жин баталгаажсан тул зөвхөн менежер/админ засах боломжтой",
        );
      // Open-window weigh edits: anyone on the floor except the gate guard.
    } else if (
      ![
        ADMIN_ROLE.SCALE,
        ADMIN_ROLE.STOREKEEPER,
        ADMIN_ROLE.MODERATOR,
        ...privileged,
      ].includes(context.role)
    ) {
      throw new Error(
        `Forbidden: role ${context.role} cannot edit weighing entries`,
      );
    }
  }

  static async updateWeighingEntry(
    doc: TUpdateWeighingEntry,
    context: TContext,
  ): Promise<WeighingEntryModel> {
    const entry = await WeighingEntryModel.findByPk(doc.id);
    if (!entry) throw new Error("Weighing entry not found");

    const reg = await RegistrationController.findIdCheck(entry.registrationId);
    this._assertWeighingEditable(reg, context);

    if (doc.weightKg !== undefined && doc.weightKg !== null) {
      if (doc.weightKg <= 0)
        throw new Error("Weight must be a positive number");
      entry.weightKg = doc.weightKg;
    }
    if (doc.pricePerKg !== undefined) {
      if (doc.pricePerKg != null && doc.pricePerKg < 0)
        throw new Error("Price per kg cannot be negative");
      entry.pricePerKg = doc.pricePerKg ?? null;
    }
    if (doc.animalType !== undefined && doc.animalType !== null) {
      const animal = await AnimalController.resolveByName(doc.animalType);
      const line = await RegistrationAnimalLineModel.findOne({
        where: { registrationId: entry.registrationId, animalId: animal.id },
      });
      if (!line)
        throw new Error(
          `Animal type ${doc.animalType} is not part of this registration`,
        );
      entry.animalId = animal.id;
    }
    if (doc.photoFileId !== undefined) {
      if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);
      entry.photoFileId = doc.photoFileId ?? null;
    }

    await entry.save();
    return entry;
  }

  static async deleteWeighingEntry(
    id: string,
    context: TContext,
  ): Promise<void> {
    const entry = await WeighingEntryModel.findByPk(id);
    if (!entry) throw new Error("Weighing entry not found");

    const reg = await RegistrationController.findIdCheck(entry.registrationId);
    this._assertWeighingEditable(reg, context);

    await entry.destroy();
  }
}
