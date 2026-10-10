import { Op, UniqueConstraintError, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { WeighingEntryAuditModel } from "../../models/livestock/weighing-entry-audit.model";
import { VerificationModel } from "../../models/livestock/verification.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { SettlementLineModel } from "../../models/livestock/settlement-line.model";
import { SettlementPaymentProofModel } from "../../models/livestock/settlement-payment-proof.model";
import { HerderModel } from "../../models/livestock/herder.model";
import { FileModel } from "../../models/global/file.model";
import { AdminModel } from "../../models/user/admin.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AnimalController } from "./animal.controller";
import { AdminController } from "../user/admin.controller";
import { MedicalNumberController } from "./medical-number.controller";
import { MedicalNumberModel } from "../../models/livestock/medical-number.model";
import {
  isPreButchered,
  REGISTRATION_STATUS,
  TCreateRegistration,
  TGetRegistrations,
} from "../../types/livestock/registration.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { ADMIN_ROLE, BYPRODUCT_FACTORY } from "../../types/user/admin.type";
import { HerderController } from "./herder.controller";
import { FileController } from "../global/file.controller";
import {
  dateRangeWhere,
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
} from "../../utils";

const MAX_CODE_RETRIES = 5;

// All livestock workflow rows (animal lines, weighing entries, byproduct logs,
// settlement lines) now FK into Animals. We eager-include `animal` everywhere
// we previously read `row.animalType` so the controller stays stateless.
const REGISTRATION_FULL_INCLUDE = [
  { model: HerderModel, as: "herder" },
  { model: FileModel, as: "photo" },
  { model: FileModel, as: "signature" },
  { model: FileModel, as: "stampImage" },
  { model: FileModel, as: "agreementSignature" },
  { model: AdminModel, as: "guard" },
  {
    model: RegistrationAnimalLineModel,
    as: "animalLines",
    include: [{ model: AnimalModel, as: "animal" }],
  },
  {
    model: WeighingEntryModel,
    as: "weighingEntries",
    include: [
      { model: AnimalModel, as: "animal" },
      { model: AdminModel, as: "scaleOperator" },
      { model: FileModel, as: "photo" },
    ],
  },
  {
    model: WeighingEntryAuditModel,
    as: "weighingAuditLog",
    include: [{ model: AdminModel, as: "actor" }],
  },
  {
    model: VerificationModel,
    as: "verification",
    include: [
      { model: AdminModel, as: "firstVerifier" },
      { model: FileModel, as: "photo" },
    ],
  },
  {
    model: SettlementModel,
    as: "settlement",
    include: [
      {
        model: SettlementLineModel,
        as: "lines",
        include: [{ model: AnimalModel, as: "animal" }],
      },
      {
        model: SettlementPaymentProofModel,
        as: "paymentProofs",
        include: [
          { model: FileModel, as: "file" },
          { model: AdminModel, as: "createdBy" },
        ],
      },
      { model: AdminModel, as: "settledBy" },
      { model: FileModel, as: "photo" },
      { model: FileModel, as: "storekeeperSignature" },
    ],
  },
];

// Core of the livestock aggregate (intake + lifecycle). The weighing,
// byproduct, verification and settlement sub-domains live in their own
// controllers and reuse the shared lookups/guards exposed here
// (findIdCheck, getById, assertStatus, assertActorRole).
export class RegistrationController {
  // ─── Shared helpers (used by the sub-domain controllers) ──────────

  // Pass the caller's context to also enforce the factory boundary (staff
  // can't reach another factory's registrations).
  static async findIdCheck(
    id: string,
    context?: TContext,
  ): Promise<RegistrationModel> {
    const reg = await findOrThrow(
      RegistrationModel,
      id,
      "Registration not found",
    );
    if (context) AdminController.assertFactory(context, reg.factory);
    return reg;
  }

  static async getById(
    id: string,
    context?: TContext,
  ): Promise<RegistrationModel> {
    const reg = await findOrThrow(
      RegistrationModel,
      id,
      "Registration not found",
      {
        include: REGISTRATION_FULL_INCLUDE,
      },
    );
    if (context) AdminController.assertFactory(context, reg.factory);
    return reg;
  }

  static assertStatus(
    reg: RegistrationModel,
    allowed: REGISTRATION_STATUS[],
  ): void {
    if (!allowed.includes(reg.status)) {
      throw new Error(
        `Invalid status transition: registration is ${reg.status}`,
      );
    }
  }

  static assertActorRole(context: TContext, allowed: ADMIN_ROLE[]): void {
    if (!context || !allowed.includes(context.role)) {
      throw new Error(
        `Forbidden: role ${context?.role} cannot perform this action`,
      );
    }
  }

  // ─── Intake (Харуулын бүртгэл) ────────────────────────────────────

  static async create(
    doc: TCreateRegistration,
    context: TContext,
  ): Promise<RegistrationModel> {
    this.assertActorRole(context, [ADMIN_ROLE.STOREKEEPER, ADMIN_ROLE.ADMIN]);

    const {
      herderId,
      vehicleNumber,
      stamp,
      photoFileId,
      signatureFileId,
      stampFileId,
      intakeDate,
    } = doc;
    const factory = AdminController.writeFactory(context, doc.factory);
    if (factory === BYPRODUCT_FACTORY)
      throw new Error("Дайврын үйлдвэр мал хүлээн авахгүй");
    // FACTORY_2 takes pre-butchered meat: no stamp, no slaughter cost.
    const pre = isPreButchered({ factory });

    if (!vehicleNumber || !vehicleNumber.trim())
      throw new Error("Vehicle number is required");
    if (!doc.animalLines || doc.animalLines.length === 0)
      throw new Error("At least one animal line is required");
    const medicalNumbers = MedicalNumberController.parseList(
      doc.medicalNumbers,
    );

    const seen = new Set<string>();
    for (const line of doc.animalLines) {
      if (!line.animalType?.trim()) throw new Error("Animal type is required");
      if (!line.count || line.count <= 0)
        throw new Error("Animal count must be a positive number");
      if (seen.has(line.animalType))
        throw new Error(`Duplicate animal line: ${line.animalType}`);
      seen.add(line.animalType);
    }

    await HerderController.findIdCheck(herderId);
    if (photoFileId) await FileController.findIdCheck(photoFileId);
    if (signatureFileId) await FileController.findIdCheck(signatureFileId);
    if (stampFileId && !pre) await FileController.findIdCheck(stampFileId);

    // Resolve every requested animal name → animalId up front.
    const typeToId = await AnimalController.mapNamesToIds(Array.from(seen));

    // Бой зардал is auto-precalculated per type = pricePerAnimal (settings) ×
    // head count. The guard only enters counts; pre-butchered intake = 0.
    const counts: Record<string, number> = {};
    for (const l of doc.animalLines) counts[l.animalType] = l.count;
    const slaughterByType = pre
      ? {}
      : await AnimalController.defaultsForCounts(counts);

    // Human-readable key REG-YYYYMMDD-N (N = per-day counter). On a same-day
    // code collision, bump N and retry the whole insert.
    const codePrefix = `REG-${dateStampUTC8()}-`;
    let counter = await nextDailyCounter(
      RegistrationModel,
      "registrationCode",
      codePrefix,
    );

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      try {
        const registration = await sequelize.transaction(async (t) => {
          const reg = await RegistrationModel.create(
            {
              registrationCode: `${codePrefix}${counter}`,
              herderId,
              vehicleNumber: vehicleNumber.trim(),
              stamp: pre ? null : (stamp ?? null),
              photoFileId: photoFileId ?? null,
              signatureFileId: signatureFileId ?? null,
              stampFileId: pre ? null : (stampFileId ?? null),
              intakeDate: intakeDate ?? new Date(),
              guardId: context.id,
              status: REGISTRATION_STATUS.REGISTERED,
              factory,
            },
            { transaction: t },
          );

          await RegistrationAnimalLineModel.bulkCreate(
            doc.animalLines.map((l) => ({
              registrationId: reg.id,
              animalId: typeToId[l.animalType],
              count: l.count,
              slaughterCost: pre ? 0 : (slaughterByType[l.animalType] ?? 0),
            })),
            { transaction: t },
          );

          await MedicalNumberModel.bulkCreate(
            medicalNumbers.map((number) => ({
              registrationId: reg.id,
              number,
            })),
            { transaction: t },
          );

          return reg;
        });

        return await this.getById(registration.id);
      } catch (err) {
        if (
          err instanceof UniqueConstraintError &&
          attempt < MAX_CODE_RETRIES - 1
        ) {
          counter++;
          continue;
        }
        throw err;
      }
    }
    throw new Error("Failed to generate a unique registration code");
  }

  static async list(
    doc: TGetRegistrations,
    context: TContext,
  ): Promise<TPaginationGeneric<RegistrationModel>> {
    const where: WhereOptions = {};
    const factory = AdminController.readFactory(context, doc.factory);
    if (factory) Object.assign(where, { factory });
    // Single status (legacy) or a set — set takes precedence when both passed.
    if (doc.statuses && doc.statuses.length > 0) {
      for (const s of doc.statuses) {
        if (!Object.values(REGISTRATION_STATUS).includes(s))
          throw new Error(`Invalid registration status: ${s}`);
      }
      Object.assign(where, { status: { [Op.in]: doc.statuses } });
    } else if (doc.status) {
      Object.assign(where, { status: doc.status });
    }
    if (doc.herderId) Object.assign(where, { herderId: doc.herderId });
    if (doc.registrationCode)
      Object.assign(where, { registrationCode: doc.registrationCode });
    Object.assign(where, dateRangeWhere(doc.dateRange, "intakeDate"));

    return listPaginated(RegistrationModel, doc, {
      where,
      include: [
        { model: HerderModel, as: "herder" },
        {
          model: RegistrationAnimalLineModel,
          as: "animalLines",
          include: [{ model: AnimalModel, as: "animal" }],
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  static async cancel(
    registrationId: string,
    context: TContext,
  ): Promise<RegistrationModel> {
    this.assertActorRole(context, [ADMIN_ROLE.ADMIN]);

    const reg = await this.findIdCheck(registrationId, context);
    // Cancellation is only allowed before the scale operator signs off
    // (REGISTERED). After WEIGHED the amounts are part of the record.
    this.assertStatus(reg, [REGISTRATION_STATUS.REGISTERED]);

    await reg.update({ status: REGISTRATION_STATUS.CANCELLED });
    return this.getById(registrationId);
  }

  // Shared guard for slip edits allowed only before VERIFIED, by intake-side
  // staff.
  private static async _guardSlipEditable(
    registrationId: string,
    context: TContext,
  ): Promise<RegistrationModel> {
    this.assertActorRole(context, [ADMIN_ROLE.STOREKEEPER, ADMIN_ROLE.ADMIN]);
    const reg = await this.findIdCheck(registrationId, context);
    this.assertStatus(reg, [
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.WEIGHED,
    ]);
    return reg;
  }

  // Attach the herder's drawn agreement signature (an already-uploaded File)
  // to the weighed slip. Allowed before VERIFIED. Pass null to clear.
  static async setAgreementSignature(
    registrationId: string,
    fileId: string | null,
    context: TContext,
  ): Promise<RegistrationModel> {
    const reg = await this._guardSlipEditable(registrationId, context);

    if (fileId) await FileController.findIdCheck(fileId);
    await reg.update({ agreementSignatureFileId: fileId ?? null });
    return this.getById(registrationId);
  }
}
