import { Op, UniqueConstraintError, WhereOptions } from "sequelize";
import { PERMISSION } from "../../types/user/permission.type";
import { FactoryController } from "../factory/factory.controller";
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
  REGISTRATION_STATUS,
  TCreateRegistration,
  TGetRegistrations,
  TRegistrationAnimalLineInput,
} from "../../types/livestock/registration.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { HerderController } from "./herder.controller";
import { WeighingController } from "./weighing.controller";
import { ByproductBundleController } from "./byproduct-bundle.controller";
import { FileController } from "../global/file.controller";
import {
  dateRangeWhere,
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
} from "../../utils";

const MAX_CODE_RETRIES = 5;

// Mongolian plate: 4 digits + 2–3 Cyrillic letters, e.g. "8901 ДОУ".
const PLATE_RE = /^(\d{4})\s*([А-ЯЁӨҮ]{2,3})$/;

// All livestock workflow rows (animal lines, weighing entries, byproduct logs,
// settlement lines) now FK into Animals. We eager-include `animal` everywhere
// we previously read `row.animalType` so the controller stays stateless.
const REGISTRATION_FULL_INCLUDE = [
  { model: HerderModel, as: "herder" },
  { model: FileModel, as: "photo" },
  { model: FileModel, as: "signature" },
  { model: FileModel, as: "stampImage" },
  { model: FileModel, as: "agreementSignature" },
  { model: FileModel, as: "ebarimtImage" },
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
// (findIdCheck, getById, assertStatus); permission guards are on AdminController.
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

  // "8901 ДОУ" whatever spacing/case was typed. Shared with intake edits.
  static normalizePlate(raw: string | null | undefined): string {
    const plate = PLATE_RE.exec((raw ?? "").trim().toUpperCase());
    if (!plate)
      throw new Error(
        "Машины дугаар буруу: 4 тоо + 2-3 үсэг байна (ж: 8901 ДОУ)",
      );
    return `${plate[1]} ${plate[2]}`;
  }

  // Pre-butchered intake lists only which meats arrived — no head
  // count (stored 0); weight + price come at weighing.
  static assertAnimalLines(
    lines: TRegistrationAnimalLineInput[],
    preButchered = false,
  ): void {
    if (!lines || lines.length === 0)
      throw new Error("At least one animal line is required");
    const seen = new Set<string>();
    for (const line of lines) {
      if (!line.animalType?.trim()) throw new Error("Animal type is required");
      if (!preButchered && (!line.count || line.count <= 0))
        throw new Error("Animal count must be a positive number");
      if (seen.has(line.animalType))
        throw new Error(`Duplicate animal line: ${line.animalType}`);
      seen.add(line.animalType);
    }
  }

  // ─── Intake (Харуулын бүртгэл) ────────────────────────────────────

  static async create(
    doc: TCreateRegistration,
    context: TContext,
  ): Promise<RegistrationModel> {
    AdminController.assertPermission(context, PERMISSION.REGISTRATION_CREATE);

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
    if (FactoryController.isByproduct(factory))
      throw new Error("Дайврын үйлдвэр мал хүлээн авахгүй");
    // Pre-butchered sites take meat: no stamp, no slaughter cost.
    const pre = FactoryController.isPreButchered(factory);
    // Its intake carries weights + prices — a weighing permission, not just intake.
    if (pre && !AdminController.hasPermission(context, PERMISSION.REGISTRATION_WEIGH))
      throw new Error("Задалсан мах хүлээн авах бүртгэлийг жинлэх эрхтэй ажилтан хийнэ");

    const plate = this.normalizePlate(vehicleNumber);
    this.assertAnimalLines(doc.animalLines, pre);
    const weighings = doc.weighings?.length ? doc.weighings : [];
    if (weighings.length > 0) {
      if (!pre)
        throw new Error("Жинг бүртгэлтэй хамт зөвхөн задалсан мах хүлээн авах үйлдвэрт оруулна");
      const types = new Set(doc.animalLines.map((l) => l.animalType));
      for (const w of weighings) {
        if (!types.has(w.animalType))
          throw new Error(`${w.animalType} бүртгэлийн малд алга`);
        if (!(Number(w.weightKg) > 0))
          throw new Error("Жин 0-ээс их байх ёстой");
        if (!(Number(w.pricePerKg) >= 0))
          throw new Error("Үнэ сөрөг байж болохгүй");
      }
    }
    const byproducts = doc.byproducts?.length ? doc.byproducts : [];
    if (byproducts.length > 0 && !pre)
      throw new Error("Дайврыг бүртгэлтэй хамт зөвхөн задалсан мах хүлээн авах үйлдвэрт оруулна");
    // FACTORY_2 weighed on the form → weighing is done: WEIGHED + stocked now
    // (no separate finish step). Without weighings it stays REGISTERED and
    // goes through the weigh page.
    const finished = pre && weighings.length > 0;
    const medicalNumbers = MedicalNumberController.parseList(
      doc.medicalNumbers,
    );
    const types = doc.animalLines.map((l) => l.animalType);

    await HerderController.findIdCheck(herderId);
    if (photoFileId) await FileController.findIdCheck(photoFileId);
    if (signatureFileId) await FileController.findIdCheck(signatureFileId);
    if (stampFileId && !pre) await FileController.findIdCheck(stampFileId);

    // Resolve every requested animal name → animalId up front.
    const typeToId = await AnimalController.mapNamesToIds(types);

    // Бой зардал is auto-precalculated per type = pricePerAnimal (settings) ×
    // head count. The guard only enters counts; pre-butchered intake = 0.
    const counts: Record<string, number> = {};
    for (const l of doc.animalLines) counts[l.animalType] = pre ? 0 : l.count;
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
              vehicleNumber: plate,
              stamp: pre ? null : (stamp ?? null),
              photoFileId: photoFileId ?? null,
              signatureFileId: signatureFileId ?? null,
              stampFileId: pre ? null : (stampFileId ?? null),
              intakeDate: intakeDate ?? new Date(),
              guardId: context.id,
              status: finished
                ? REGISTRATION_STATUS.WEIGHED
                : REGISTRATION_STATUS.REGISTERED,
              factory,
            },
            { transaction: t },
          );

          await RegistrationAnimalLineModel.bulkCreate(
            doc.animalLines.map((l) => ({
              registrationId: reg.id,
              animalId: typeToId[l.animalType],
              count: pre ? 0 : l.count,
              slaughterCost: pre ? 0 : (slaughterByType[l.animalType] ?? 0),
            })),
            { transaction: t },
          );

          // FACTORY_2: meat weighed on the intake form.
          for (const w of weighings)
            await WeighingController.insertEntry(
              {
                registrationId: reg.id,
                animalId: typeToId[w.animalType],
                weightKg: Number(w.weightKg),
                pricePerKg: Number(w.pricePerKg),
                photoFileId: null,
              },
              context.id,
              t,
            );

          if (byproducts.length > 0)
            await ByproductBundleController.writeBundles(
              reg.id,
              factory,
              byproducts,
              true,
              t,
            );
          if (finished)
            await WeighingController.stockPreButchered(reg.id, factory, t);

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
      // Arrival order: the first registered is on top.
      order: [["createdAt", "ASC"]],
      distinct: true,
    });
  }

  static async cancel(
    registrationId: string,
    context: TContext,
  ): Promise<RegistrationModel> {
    AdminController.assertPermission(context, PERMISSION.REGISTRATION_CANCEL);

    const reg = await this.findIdCheck(registrationId, context);
    // Cancellation is only allowed before the scale operator signs off
    // (REGISTERED). After WEIGHED the amounts are part of the record.
    this.assertStatus(reg, [REGISTRATION_STATUS.REGISTERED]);

    await reg.update({ status: REGISTRATION_STATUS.CANCELLED });
    return this.getById(registrationId);
  }
}
