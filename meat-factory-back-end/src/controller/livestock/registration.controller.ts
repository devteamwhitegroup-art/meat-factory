import { Op, Transaction, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { ByproductLogModel } from "../../models/livestock/byproduct-log.model";
import { VerificationModel } from "../../models/livestock/verification.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { SettlementLineModel } from "../../models/livestock/settlement-line.model";
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
} from "../../types/livestock/registration.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { ADMIN_ROLE } from "../../types/user/admin.type";
import { HerderController } from "./herder.controller";
import { FileController } from "../global/file.controller";
import { findOrThrow, listPaginated } from "../../utils";

// All livestock workflow rows (animal lines, weighing entries, byproduct logs,
// settlement lines) now FK into Animals. We eager-include `animal` everywhere
// we previously read `row.animalType` so the controller stays stateless.
const REGISTRATION_FULL_INCLUDE = [
  { model: HerderModel, as: "herder" },
  { model: FileModel, as: "photo" },
  { model: FileModel, as: "signature" },
  { model: FileModel, as: "stampImage" },
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

    return await sequelize
      .transaction(async (t) => {
        const registrationNumber = await this._nextRegistrationNumber(t);

        const registration = await RegistrationModel.create(
          {
            registrationNumber,
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
            registrationId: registration.id,
            animalId: typeToId[l.animalType],
            count: l.count,
          })),
          { transaction: t },
        );

        return registration;
      })
      .then((r) => this.getById(r.id));
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
}
