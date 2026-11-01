import { Includeable, Op, Transaction, WhereOptions } from "sequelize";
import { PERMISSION } from "../../types/user/permission.type";
import { FactoryController } from "../factory/factory.controller";
import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { WeighingEntryAuditModel } from "../../models/livestock/weighing-entry-audit.model";
import { VerificationModel } from "../../models/livestock/verification.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
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
import { SETTLEMENT_INCLUDE } from "./settlement.controller";
import {
  createWithUniqueCode,
  dateRangeWhere,
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
  round2,
} from "../../utils";

// Intake fields stay editable (direct or by change request) until a
// settlement exists — after that the intake is part of a payout.
export const EDITABLE_STATUSES = [
  REGISTRATION_STATUS.REGISTERED,
  REGISTRATION_STATUS.WEIGHED,
  REGISTRATION_STATUS.VERIFIED,
];

// Everything a registration can have done to it. `Registration.can` exposes
// each as a boolean for the FE.
export type TRegAction =
  | "weigh"
  | "finishWeighing"
  | "verify"
  | "editByproducts"
  | "createSettlement"
  | "pay"
  | "releaseHold"
  | "cancel"
  | "editIntake";
export const REG_ACTIONS: TRegAction[] = [
  "weigh",
  "finishWeighing",
  "verify",
  "editByproducts",
  "createSettlement",
  "pay",
  "releaseHold",
  "cancel",
  "editIntake",
];

// Mongolian plate: 4 digits + 2–3 Cyrillic letters, e.g. "8901 ДОУ".
const PLATE_RE = /^(\d{4})\s*([А-ЯЁӨҮ]{2,3})$/;

// The registration detail. Has-many children load as separate queries —
// joined in one SELECT their row counts multiplied (entries × audit × lines …).
// A function: Sequelize mutates include objects, so each read builds fresh ones.
const REGISTRATION_FULL_INCLUDE = (): Includeable[] => [
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
    separate: true,
    include: [{ model: AnimalModel, as: "animal" }],
  },
  {
    model: WeighingEntryModel,
    as: "weighingEntries",
    separate: true,
    order: [["sequenceNo", "ASC"]],
    include: [
      { model: AnimalModel, as: "animal" },
      { model: AdminModel, as: "scaleOperator" },
      { model: FileModel, as: "photo" },
    ],
  },
  {
    model: WeighingEntryAuditModel,
    as: "weighingAuditLog",
    separate: true,
    order: [["createdAt", "ASC"]],
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
  { model: SettlementModel, as: "settlement", include: SETTLEMENT_INCLUDE() },
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
      { include: REGISTRATION_FULL_INCLUDE() },
    );
    if (context) AdminController.assertFactory(context, reg.factory);
    return reg;
  }

  // Row-locked load for a mutation's transaction: two clerks (or a
  // double-click) on one registration run one after the other, each seeing
  // the other's status change.
  static async lock(
    id: string,
    context: TContext,
    t: Transaction,
  ): Promise<RegistrationModel> {
    const reg = await findOrThrow(RegistrationModel, id, "Registration not found", {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    AdminController.assertFactory(context, reg.factory);
    return reg;
  }

  // Who may do what to a registration, and when — the ONE source for the
  // mutation guards (assertCan) and the FE's `Registration.can` flags, so no
  // screen re-derives status rules. null = allowed, else the reason why not.
  static blocker(
    reg: RegistrationModel,
    context: TContext,
    action: TRegAction,
  ): string | null {
    const S = REGISTRATION_STATUS;
    const P = PERMISSION;
    const live = FactoryController.rules(reg.factory).liveAnimals;
    const at = (...ok: REGISTRATION_STATUS[]) => ok.includes(reg.status);
    const need = (p: PERMISSION) =>
      AdminController.hasPermission(context, p) ? null : "Энэ үйлдлийн эрх танд алга";
    const wrongStatus = `Бүртгэлийн төлөв (${reg.status}) энэ үйлдэлд тохирохгүй`;
    switch (action) {
      case "weigh":
        if (at(S.SETTLED, S.PARTIALLY_SETTLED, S.CANCELLED))
          return "Төлбөр хийгдсэн эсвэл бүртгэл хаагдсан тул жинг засах боломжгүй";
        if (at(S.REGISTERED)) return need(P.REGISTRATION_WEIGH);
        // Weighed onwards, until paid: a privileged fix, audit-logged; an
        // unpaid settlement is recalculated with it.
        return AdminController.hasPermission(context, P.REGISTRATION_WEIGH_FIX)
          ? null
          : "Жин баталгаажсан тул засах тусгай эрх шаардлагатай";
      case "finishWeighing":
        return at(S.REGISTERED) ? need(P.REGISTRATION_WEIGH) : wrongStatus;
      case "verify":
        if (!live)
          return "Задалсан мах хүлээн авах үйлдвэрт баталгаажуулалт хийгдэхгүй";
        return at(S.WEIGHED) ? need(P.REGISTRATION_VERIFY) : wrongStatus;
      case "editByproducts":
        // Live: the herder's take is decided at verify, correctable until
        // settled. Pre-butchered: counted with the intake.
        return (live ? at(S.WEIGHED, S.VERIFIED) : at(S.REGISTERED))
          ? need(P.REGISTRATION_WEIGH)
          : wrongStatus;
      case "createSettlement":
        return at(live ? S.VERIFIED : S.WEIGHED)
          ? need(P.SETTLEMENT_CREATE)
          : wrongStatus;
      case "pay":
        return at(S.PAYMENT_PENDING) ? need(P.SETTLEMENT_PAY) : wrongStatus;
      case "releaseHold":
        if (!at(S.PARTIALLY_SETTLED)) return wrongStatus;
        if (!reg.medicalNumberApproved)
          return "Мал эмнэлгийн дугаар батлагдаагүй байна";
        return need(P.SETTLEMENT_PAY);
      case "cancel":
        // Before weighing is signed off; after that amounts are on record.
        return at(S.REGISTERED) ? need(P.REGISTRATION_CANCEL) : wrongStatus;
      case "editIntake":
        return at(...EDITABLE_STATUSES)
          ? need(P.REGISTRATION_CREATE)
          : "Тооцоо үүссэн бүртгэлийг засах боломжгүй";
    }
  }

  static assertCan(
    reg: RegistrationModel,
    context: TContext,
    action: TRegAction,
  ): void {
    const why = this.blocker(reg, context, action);
    if (why) throw new Error(why);
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

  // Live intake counts heads; pre-butchered lists only which meats arrived
  // (head count stored 0; weight + price come at weighing).
  static assertAnimalLines(
    lines: TRegistrationAnimalLineInput[],
    liveAnimals: boolean,
  ): void {
    if (!lines || lines.length === 0)
      throw new Error("At least one animal line is required");
    const seen = new Set<string>();
    for (const line of lines) {
      if (!line.animalType?.trim()) throw new Error("Animal type is required");
      if (liveAnimals && (!line.count || line.count <= 0))
        throw new Error("Animal count must be a positive number");
      if (seen.has(line.animalType))
        throw new Error(`Duplicate animal line: ${line.animalType}`);
      seen.add(line.animalType);
    }
  }

  // Live intake of a stamp-requiring animal (catalogue flag) needs the brand
  // mark and, on first intake, its drawing.
  static assertStamp(
    lines: TRegistrationAnimalLineInput[],
    animals: Map<string, AnimalModel>,
    stamp: string | null | undefined,
    stampFileId?: string | null,
    requireDrawing = true,
  ): void {
    const branded = lines.find(
      (l) => l.count > 0 && animals.get(l.animalType.trim())?.requiresStamp,
    );
    if (!branded) return;
    if (!stamp?.trim())
      throw new Error(`${branded.animalType}: таних тэмдэг шаардлагатай`);
    if (requireDrawing && !stampFileId)
      throw new Error(`${branded.animalType}: тамга зурна уу`);
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
      ebarimtImageFileId,
    } = doc;
    const factory = AdminController.writeFactory(context, doc.factory);
    const { takesIntake, liveAnimals } = FactoryController.rules(factory);
    if (!takesIntake) throw new Error("Энэ үйлдвэр мал хүлээн авахгүй");
    // Pre-butchered intake carries weights + prices — a weighing permission.
    if (
      !liveAnimals &&
      !AdminController.hasPermission(context, PERMISSION.REGISTRATION_WEIGH)
    )
      throw new Error("Задалсан мах хүлээн авах бүртгэлийг жинлэх эрхтэй ажилтан хийнэ");

    const plate = this.normalizePlate(vehicleNumber);
    this.assertAnimalLines(doc.animalLines, liveAnimals);
    const weighings = doc.weighings ?? [];
    const byproducts = doc.byproducts ?? [];
    if (liveAnimals && (weighings.length || byproducts.length))
      throw new Error(
        "Жин, дайврыг бүртгэлтэй хамт зөвхөн задалсан мах хүлээн авах үйлдвэрт оруулна",
      );
    const types = new Set(doc.animalLines.map((l) => l.animalType));
    for (const w of weighings) {
      if (!types.has(w.animalType))
        throw new Error(`${w.animalType} бүртгэлийн малд алга`);
      WeighingController.assertValues(w.weightKg, w.pricePerKg);
    }
    // Pre-butchered weighed on the form → weighing is done: WEIGHED + stocked
    // now. Without weighings it stays REGISTERED and goes via the weigh page.
    const finished = weighings.length > 0;
    const medicalNumbers = MedicalNumberController.parseList(
      doc.medicalNumbers,
    );

    await HerderController.findIdCheck(herderId);
    if (photoFileId) await FileController.findIdCheck(photoFileId);
    if (signatureFileId) await FileController.findIdCheck(signatureFileId);
    if (ebarimtImageFileId) await FileController.findIdCheck(ebarimtImageFileId);
    if (stampFileId && liveAnimals) await FileController.findIdCheck(stampFileId);

    // Name → id once; бой зардал = pricePerAnimal × heads (live only).
    const animals = await AnimalController.byNames([...types]);
    if (liveAnimals) this.assertStamp(doc.animalLines, animals, stamp, stampFileId);
    const lineRows = doc.animalLines.map((l) => {
      const animal = animals.get(l.animalType.trim())!;
      const count = liveAnimals ? l.count : 0;
      return {
        animalId: animal.id,
        count,
        slaughterCost: liveAnimals
          ? round2(Number(animal.pricePerAnimal) * count)
          : 0,
      };
    });

    // Human-readable key REG-YYYYMMDD-N (N = per-day counter, bumped on a
    // same-day collision).
    const codePrefix = `REG-${dateStampUTC8()}-`;
    const first = await nextDailyCounter(
      RegistrationModel,
      "registrationCode",
      codePrefix,
    );
    const registration = await createWithUniqueCode(async (attempt, t) => {
      const reg = await RegistrationModel.create(
        {
          registrationCode: `${codePrefix}${first + attempt}`,
          herderId,
          vehicleNumber: plate,
          stamp: liveAnimals ? (stamp ?? null) : null,
          photoFileId: photoFileId ?? null,
          signatureFileId: signatureFileId ?? null,
          stampFileId: liveAnimals ? (stampFileId ?? null) : null,
          ebarimtTaken: !!doc.ebarimtTaken,
          ebarimtImageFileId: ebarimtImageFileId ?? null,
          ebarimtNote: doc.ebarimtNote?.trim() || null,
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
        lineRows.map((l) => ({ ...l, registrationId: reg.id })),
        { transaction: t },
      );
      await WeighingController.insertEntries(
        weighings.map((w) => ({
          registrationId: reg.id,
          animalId: animals.get(w.animalType.trim())!.id,
          weightKg: Number(w.weightKg),
          pricePerKg: Number(w.pricePerKg),
          photoFileId: null,
        })),
        context.id,
        t,
      );
      if (byproducts.length)
        await ByproductBundleController.writeBundles(reg.id, factory, byproducts, t);
      if (finished)
        await WeighingController.stockAtWeighing(reg.id, factory, t);
      await MedicalNumberModel.bulkCreate(
        medicalNumbers.map((number) => ({ registrationId: reg.id, number })),
        { transaction: t },
      );
      return reg;
    });
    return this.getById(registration.id);
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
    await sequelize.transaction(async (t) => {
      const reg = await this.lock(registrationId, context, t);
      this.assertCan(reg, context, "cancel");
      await reg.update({ status: REGISTRATION_STATUS.CANCELLED }, { transaction: t });
    });
    return this.getById(registrationId);
  }
}
