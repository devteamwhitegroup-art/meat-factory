import {
  Op,
  Transaction,
  UniqueConstraintError,
  WhereOptions,
} from "sequelize";
import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { ByproductLogModel } from "../../models/livestock/byproduct-log.model";
import { VerificationModel } from "../../models/livestock/verification.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { SettlementLineModel } from "../../models/livestock/settlement-line.model";
import { SettlementPaymentProofModel } from "../../models/livestock/settlement-payment-proof.model";
import { HerderModel } from "../../models/livestock/herder.model";
import { FileModel } from "../../models/global/file.model";
import { AdminModel } from "../../models/user/admin.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AnimalController } from "./animal.controller";
import {
  ANIMAL_TYPE,
  REGISTRATION_NUMBER_START,
  REGISTRATION_STATUS,
  TCreateRegistration,
  TGetRegistrations,
  TSlaughterCostInput,
} from "../../types/livestock/registration.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { ADMIN_ROLE } from "../../types/user/admin.type";
import { HerderController } from "./herder.controller";
import { FileController } from "../global/file.controller";
import {
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
    model: ByproductLogModel,
    as: "byproductLogs",
    include: [
      { model: AnimalModel, as: "animal" },
      { model: AdminModel, as: "loggedBy" },
      { model: FileModel, as: "photo" },
    ],
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
    ],
  },
];

// Core of the livestock aggregate (intake + lifecycle). The weighing,
// byproduct, verification and settlement sub-domains live in their own
// controllers and reuse the shared lookups/guards exposed here
// (findIdCheck, getById, assertStatus, assertActorRole).
export class RegistrationController {
  // ─── Shared helpers (used by the sub-domain controllers) ──────────

  static findIdCheck(id: string): Promise<RegistrationModel> {
    return findOrThrow(RegistrationModel, id, "Registration not found");
  }

  static getById(id: string): Promise<RegistrationModel> {
    return findOrThrow(RegistrationModel, id, "Registration not found", {
      include: REGISTRATION_FULL_INCLUDE,
    });
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

  private static async _nextRegistrationNumber(
    t: Transaction,
  ): Promise<number> {
    const [rows] = await sequelize.query(
      "SELECT nextval('registration_number_seq') AS n",
      { transaction: t },
    );
    return Number((rows as Array<{ n: string }>)[0].n);
  }

  // Preview the next Бүртгэлийн дугаар WITHOUT consuming the sequence.
  // Informational only (racy); the real number is assigned at create time.
  static async previewNextRegistrationNumber(): Promise<number> {
    try {
      const [rows] = await sequelize.query(
        "SELECT last_value, is_called FROM registration_number_seq",
      );
      const row = (
        rows as Array<{ last_value: string; is_called: boolean }>
      )[0];
      if (!row) return REGISTRATION_NUMBER_START;
      const last = Number(row.last_value);
      return row.is_called ? last + 1 : last;
    } catch {
      return REGISTRATION_NUMBER_START;
    }
  }

  // ─── Intake (Харуулын бүртгэл) ────────────────────────────────────

  static async create(
    doc: TCreateRegistration,
    context: TContext,
  ): Promise<RegistrationModel> {
    this.assertActorRole(context, [
      ADMIN_ROLE.GUARD,
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
      ADMIN_ROLE.SCALE,
    ]);

    const {
      herderId,
      vehicleNumber,
      stamp,
      medicalNumber,
      photoFileId,
      signatureFileId,
      stampFileId,
      intakeDate,
      isPreButchered,
    } = doc;

    if (!vehicleNumber || !vehicleNumber.trim())
      throw new Error("Vehicle number is required");
    if (!doc.animalLines || doc.animalLines.length === 0)
      throw new Error("At least one animal line is required");

    const seen = new Set<ANIMAL_TYPE>();
    for (const line of doc.animalLines) {
      if (!Object.values(ANIMAL_TYPE).includes(line.animalType))
        throw new Error(`Invalid animal type: ${line.animalType}`);
      if (!line.count || line.count <= 0)
        throw new Error("Animal count must be a positive number");
      if (seen.has(line.animalType))
        throw new Error(`Duplicate animal line: ${line.animalType}`);
      seen.add(line.animalType);
    }

    await HerderController.findIdCheck(herderId);
    if (photoFileId) await FileController.findIdCheck(photoFileId);
    if (signatureFileId) await FileController.findIdCheck(signatureFileId);
    if (stampFileId) await FileController.findIdCheck(stampFileId);

    // Resolve every requested animalType → animalId up front.
    const typeToId = await AnimalController.mapTypesToIds(Array.from(seen));

    // Бой зардал is auto-precalculated per type = pricePerAnimal (settings) ×
    // head count. The guard only enters counts; pre-butchered intake = 0.
    const counts: Record<string, number> = {};
    for (const l of doc.animalLines) counts[l.animalType] = l.count;
    const slaughterByType = isPreButchered
      ? {}
      : await AnimalController.defaultsForCounts(counts);

    // Human-readable code REG-YYYYMMDD-N (N = per-day counter). The numeric
    // registrationNumber (8821+) is kept separately. On a same-day code
    // collision, bump N and retry the whole insert.
    const codePrefix = `REG-${dateStampUTC8()}-`;
    let counter = await nextDailyCounter(
      RegistrationModel,
      "registrationCode",
      codePrefix,
    );

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      try {
        const registration = await sequelize.transaction(async (t) => {
          const registrationNumber = await this._nextRegistrationNumber(t);

          const reg = await RegistrationModel.create(
            {
              registrationNumber,
              registrationCode: `${codePrefix}${counter}`,
              herderId,
              vehicleNumber: vehicleNumber.trim(),
              stamp: stamp ?? null,
              medicalNumber: medicalNumber?.trim() || null,
              photoFileId: photoFileId ?? null,
              signatureFileId: signatureFileId ?? null,
              stampFileId: stampFileId ?? null,
              intakeDate: intakeDate ?? new Date(),
              guardId: context.id,
              status: REGISTRATION_STATUS.REGISTERED,
              isPreButchered: !!isPreButchered,
            },
            { transaction: t },
          );

          await RegistrationAnimalLineModel.bulkCreate(
            doc.animalLines.map((l) => ({
              registrationId: reg.id,
              animalId: typeToId[l.animalType],
              count: l.count,
              slaughterCost: isPreButchered
                ? 0
                : (slaughterByType[l.animalType] ?? 0),
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
  ): Promise<TPaginationGeneric<RegistrationModel>> {
    const where: WhereOptions = {};
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
    if (doc.registrationNumber)
      Object.assign(where, { registrationNumber: doc.registrationNumber });
    if (doc.dateRange?.startDate || doc.dateRange?.endDate) {
      const range: Record<symbol, Date> = {};
      if (doc.dateRange.startDate)
        range[Op.gte] = new Date(doc.dateRange.startDate);
      if (doc.dateRange.endDate)
        range[Op.lte] = new Date(doc.dateRange.endDate);
      Object.assign(where, { intakeDate: range });
    }

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
    this.assertActorRole(context, [ADMIN_ROLE.MANAGER, ADMIN_ROLE.SUPER_ADMIN]);

    const reg = await this.findIdCheck(registrationId);
    // Cancellation is only allowed before the scale operator signs off
    // (REGISTERED). After WEIGHED the amounts are part of the record.
    this.assertStatus(reg, [REGISTRATION_STATUS.REGISTERED]);

    await reg.update({ status: REGISTRATION_STATUS.CANCELLED });
    return this.getById(registrationId);
  }

  // Factory confirms the herder's medical number. Optionally sets the number
  // first (herder may supply it after intake). Once approved, a settlement's
  // held portion can be released. Idempotent.
  static async approveMedicalNumber(
    registrationId: string,
    medicalNumber: string | null | undefined,
    context: TContext,
  ): Promise<RegistrationModel> {
    this.assertActorRole(context, [
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);

    const reg = await this.findIdCheck(registrationId);
    const number =
      medicalNumber != null && medicalNumber.trim()
        ? medicalNumber.trim()
        : reg.medicalNumber;
    if (!number)
      throw new Error("Эмнэлгийн дугаар оруулаагүй тул батлах боломжгүй");

    await reg.update({ medicalNumber: number, medicalNumberApproved: true });
    return this.getById(registrationId);
  }

  // Capture бой зардал per animal type at weighing (before VERIFIED) so it
  // prints on the herder slip. Settlement defaults to these values. Editable
  // only while REGISTERED / WEIGHED. Pre-butchered intake forces cost to 0.
  static async setSlaughterCosts(
    registrationId: string,
    lines: TSlaughterCostInput[],
    context: TContext,
  ): Promise<RegistrationModel> {
    this.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);

    const reg = await this.findIdCheck(registrationId);
    this.assertStatus(reg, [
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.WEIGHED,
    ]);

    if (!lines || lines.length === 0)
      throw new Error("At least one slaughter-cost line is required");

    const animalLines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId },
      include: [{ model: AnimalModel, as: "animal" }],
    });
    const lineByType = new Map<string, RegistrationAnimalLineModel>();
    for (const al of animalLines)
      if (al.animal?.animalType) lineByType.set(al.animal.animalType, al);

    for (const l of lines) {
      const al = lineByType.get(l.animalType);
      if (!al)
        throw new Error(`${l.animalType} is not part of this registration`);
      const cost = reg.isPreButchered ? 0 : Number(l.slaughterCost ?? 0);
      if (!Number.isFinite(cost) || cost < 0)
        throw new Error("slaughterCost cannot be negative");
      await al.update({ slaughterCost: Number(cost.toFixed(2)) });
    }

    return this.getById(registrationId);
  }

  // Attach the herder's drawn agreement signature (an already-uploaded File)
  // to the weighed slip. Allowed before VERIFIED. Pass null to clear.
  static async setAgreementSignature(
    registrationId: string,
    fileId: string | null,
    context: TContext,
  ): Promise<RegistrationModel> {
    this.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
      ADMIN_ROLE.SCALE,
    ]);

    const reg = await this.findIdCheck(registrationId);
    this.assertStatus(reg, [
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.WEIGHED,
    ]);

    if (fileId) await FileController.findIdCheck(fileId);
    await reg.update({ agreementSignatureFileId: fileId ?? null });
    return this.getById(registrationId);
  }
}
