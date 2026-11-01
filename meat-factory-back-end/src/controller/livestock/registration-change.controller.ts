import { Includeable, Transaction, WhereOptions } from "sequelize";
import { AdminController } from "../user/admin.controller";
import { PERMISSION } from "../../types/user/permission.type";
import { FactoryController } from "../factory/factory.controller";
import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { RegistrationChangeRequestModel } from "../../models/livestock/registration-change-request.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { HerderModel } from "../../models/livestock/herder.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AdminModel } from "../../models/user/admin.model";
import {
  EDITABLE_STATUSES,
  RegistrationController,
} from "./registration.controller";
import { ByproductBundleController } from "./byproduct-bundle.controller";
import { HerderController } from "./herder.controller";
import { AnimalController } from "./animal.controller";
import { WeighingController } from "./weighing.controller";
import {
  CHANGE_REQUEST_STATUS,
  TGetRegistrationChangeRequests,
  TIntakeChanges,
  TRegistrationChanges,
  TRequestRegistrationChange,
  TUpdateRegistration,
} from "../../types/livestock/registration.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { dateStampUTC8, findOrThrow, listPaginated } from "../../utils";


const ADMIN_ATTRS = ["id", "param"];

// A function: Sequelize mutates include objects. `factory` scopes the
// review queue to one site (staff bound to a factory see only theirs).
const REQUEST_INCLUDE = (factory?: string | null): Includeable[] => [
  {
    model: RegistrationModel,
    as: "registration",
    ...(factory ? { where: { factory }, required: true } : {}),
    include: [
      { model: HerderModel, as: "herder" },
      {
        model: RegistrationAnimalLineModel,
        as: "animalLines",
        include: [{ model: AnimalModel, as: "animal" }],
      },
    ],
  },
  { model: AdminModel, as: "requestedBy", attributes: ADMIN_ATTRS },
  { model: AdminModel, as: "reviewedBy", attributes: ADMIN_ATTRS },
];

// Fixing a registration after creation. Intake data (herder, plate, stamp,
// animal counts): the person who registered it may edit directly until their
// day (UTC+8) ends; after that — or for anyone else — it's a change request
// that admin approves. Finished weighing (weight / price / extra entries) is
// admin-locked, so staff fixes to it are always requests.
export class RegistrationChangeController {
  static canEditDirect(reg: RegistrationModel, context: TContext): boolean {
    if (AdminController.hasPermission(context, PERMISSION.CHANGE_REQUEST_REVIEW))
      return true;
    return (
      reg.guardId === context.id &&
      dateStampUTC8(reg.createdAt) === dateStampUTC8()
    );
  }

  // Validate + normalise; shared by edit, request and approve (re-checked at
  // approval since the registration may have moved on).
  private static async _normalize(
    reg: RegistrationModel,
    doc: TRegistrationChanges,
  ): Promise<TRegistrationChanges> {
    if (!EDITABLE_STATUSES.includes(reg.status))
      throw new Error("Тооцоо үүссэн бүртгэлийг засах боломжгүй");
    const weights = doc.weights?.length ? doc.weights : null;
    const added = doc.added?.length ? doc.added : null;
    if (!doc.intake && !weights && !added) throw new Error("Өөрчлөлт алга");

    let intake: TIntakeChanges | null = null;
    const { liveAnimals } = FactoryController.rules(reg.factory);
    if (doc.intake) {
      RegistrationController.assertAnimalLines(
        doc.intake.animalLines,
        liveAnimals,
      );
      await HerderController.findIdCheck(doc.intake.herderId);
      if (liveAnimals)
        RegistrationController.assertStamp(
          doc.intake.animalLines,
          await AnimalController.byNames(
            doc.intake.animalLines.map((l) => l.animalType),
          ),
          doc.intake.stamp,
          null,
          false,
        );
      intake = {
        herderId: doc.intake.herderId,
        vehicleNumber: RegistrationController.normalizePlate(
          doc.intake.vehicleNumber,
        ),
        stamp: liveAnimals ? doc.intake.stamp?.trim() || null : null,
        animalLines: doc.intake.animalLines.map((l) => ({
          animalType: l.animalType,
          count: liveAnimals ? l.count : 0,
        })),
      };
    }
    if (weights) {
      const ids = new Set(weights.map((w) => w.entryId));
      const found = await WeighingEntryModel.count({
        where: { registrationId: reg.id, id: [...ids] },
      });
      if (found !== ids.size || ids.size !== weights.length)
        throw new Error("Жингийн бичлэг энэ бүртгэлд олдсонгүй");
    }
    if (added) {
      // Against the proposed animal lines when the intake changes too.
      const types = new Set(
        intake
          ? intake.animalLines.map((l) => l.animalType)
          : (
              await RegistrationAnimalLineModel.findAll({
                where: { registrationId: reg.id },
                include: [{ model: AnimalModel, as: "animal" }],
              })
            ).map((l) => l.animal?.name),
      );
      const missing = added.find((a) => !types.has(a.animalType));
      if (missing)
        throw new Error(`${missing.animalType} энэ бүртгэлийн малд алга`);
    }
    for (const w of [...(weights ?? []), ...(added ?? [])])
      WeighingController.assertValues(w.weightKg, w.pricePerKg);
    return {
      intake,
      weights: weights?.map((w) => ({
        entryId: w.entryId,
        weightKg: w.weightKg,
        pricePerKg: w.pricePerKg ?? null,
      })),
      added: added?.map((a) => ({
        animalType: a.animalType,
        weightKg: a.weightKg,
        pricePerKg: a.pricePerKg ?? null,
      })),
    };
  }

  private static async _apply(
    reg: RegistrationModel,
    c: TRegistrationChanges,
    actorId: string,
    t: Transaction,
  ): Promise<void> {
    if (c.intake) await this._applyIntake(reg, c.intake, t);

    // ponytail: like a direct admin weight fix, stock already ingested at
    // verify / finishWeighing is not re-synced.
    const weights = c.weights ?? [];
    const entries = new Map(
      (
        await WeighingEntryModel.findAll({
          where: { id: weights.map((w) => w.entryId) },
          transaction: t,
        })
      ).map((e) => [e.id, e]),
    );
    for (const w of weights) {
      const entry = entries.get(w.entryId);
      if (entry)
        await WeighingController.setEntry(
          entry,
          w.weightKg,
          w.pricePerKg ?? null,
          actorId,
          t,
        );
    }
    if (c.added?.length) {
      const typeToId = await AnimalController.mapNamesToIds(
        c.added.map((a) => a.animalType),
      );
      await WeighingController.insertEntries(
        c.added.map((a) => ({
          registrationId: reg.id,
          animalId: typeToId[a.animalType.trim()],
          weightKg: a.weightKg,
          pricePerKg: a.pricePerKg ?? null,
          photoFileId: null,
        })),
        actorId,
        t,
      );
    }
  }

  private static async _applyIntake(
    reg: RegistrationModel,
    c: TIntakeChanges,
    t: Transaction,
  ): Promise<void> {
    const typeToId = await AnimalController.mapNamesToIds(
      c.animalLines.map((l) => l.animalType),
    );
    const existing = await RegistrationAnimalLineModel.findAll({
      where: { registrationId: reg.id },
      transaction: t,
    });
    const wanted = new Set(Object.values(typeToId));
    const removed = existing.filter((l) => !wanted.has(l.animalId));
    if (removed.length > 0) {
      const where = {
        registrationId: reg.id,
        animalId: removed.map((l) => l.animalId),
      };
      if (await WeighingEntryModel.count({ where, transaction: t }))
        throw new Error("Жинлэгдсэн малын төрлийг хасах боломжгүй");
      // Its counted гэдэс would lose their settlement line (and credit).
      const bundles = await ByproductBundleController.bundlesFor(reg.id, t);
      if (bundles.some((b) => b.id && b.count > 0 && where.animalId.includes(b.animalId)))
        throw new Error("Дайвар тоологдсон малын төрлийг хасах боломжгүй");
      await RegistrationAnimalLineModel.destroy({
        where: { id: removed.map((l) => l.id) },
        transaction: t,
      });
    }

    // Бой зардал is re-priced only for new lines / changed counts.
    const changed: Record<string, number> = {};
    for (const l of c.animalLines) {
      const old = existing.find((e) => e.animalId === typeToId[l.animalType]);
      if (!old || old.count !== l.count) changed[l.animalType] = l.count;
    }
    const cost = FactoryController.rules(reg.factory).liveAnimals
      ? await AnimalController.defaultsForCounts(changed)
      : {};
    for (const [type, count] of Object.entries(changed)) {
      const animalId = typeToId[type];
      const slaughterCost = cost[type] ?? 0;
      const old = existing.find((e) => e.animalId === animalId);
      if (old) await old.update({ count, slaughterCost }, { transaction: t });
      else
        await RegistrationAnimalLineModel.create(
          { registrationId: reg.id, animalId, count, slaughterCost },
          { transaction: t },
        );
    }

    await reg.update(
      { herderId: c.herderId, vehicleNumber: c.vehicleNumber, stamp: c.stamp },
      { transaction: t },
    );
    // Counted гэдэс must still fit the new head counts.
    await ByproductBundleController.revalidate(reg.id, reg.factory, t);
  }

  static async update(
    doc: TUpdateRegistration,
    context: TContext,
  ): Promise<RegistrationModel> {
    AdminController.assertPermission(context, PERMISSION.REGISTRATION_CREATE);
    const reg = await RegistrationController.findIdCheck(doc.id, context);
    if (!this.canEditDirect(reg, context))
      throw new Error(
        "Бүртгэсэн өдөр өнгөрсөн тул админд засварын хүсэлт илгээнэ үү",
      );
    const changes = await this._normalize(reg, { intake: doc });
    await sequelize.transaction((t) =>
      this._apply(reg, changes, context.id, t),
    );
    return RegistrationController.getById(reg.id);
  }

  static async request(
    doc: TRequestRegistrationChange,
    context: TContext,
  ): Promise<RegistrationChangeRequestModel> {
    AdminController.assertPermission(context, PERMISSION.REGISTRATION_CREATE);
    // Weight log fixes are for weighers only (e.g. Эмч registers but never weighs).
    if (doc.weights?.length || doc.added?.length)
      AdminController.assertPermission(
        context,
        PERMISSION.REGISTRATION_WEIGH,
        PERMISSION.REGISTRATION_WEIGH_FIX,
      );
    const reg = await RegistrationController.findIdCheck(
      doc.registrationId,
      context,
    );
    const reason = doc.reason?.trim();
    if (!reason) throw new Error("Засварын шалтгаан бичнэ үү");
    const pending = await RegistrationChangeRequestModel.findOne({
      where: { registrationId: reg.id, status: CHANGE_REQUEST_STATUS.PENDING },
    });
    if (pending) throw new Error("Энэ бүртгэлд шийдвэрлэгдээгүй хүсэлт байна");
    const changes = await this._normalize(reg, doc);
    const row = await RegistrationChangeRequestModel.create({
      registrationId: reg.id,
      requestedById: context.id,
      changes,
      reason,
    });
    return this._get(row.id);
  }

  static async review(
    id: string,
    approve: boolean,
    note: string | null | undefined,
    context: TContext,
  ): Promise<RegistrationChangeRequestModel> {
    AdminController.assertPermission(context, PERMISSION.CHANGE_REQUEST_REVIEW);
    const req = await findOrThrow(
      RegistrationChangeRequestModel,
      id,
      "Хүсэлт олдсонгүй",
    );
    if (req.status !== CHANGE_REQUEST_STATUS.PENDING)
      throw new Error("Хүсэлт аль хэдийн шийдвэрлэгдсэн");
    await sequelize.transaction(async (t) => {
      if (approve) {
        const reg = await RegistrationController.lock(
          req.registrationId,
          context,
          t,
        );
        await this._apply(
          reg,
          await this._normalize(reg, req.changes),
          context.id,
          t,
        );
      }
      await req.update(
        {
          status: approve
            ? CHANGE_REQUEST_STATUS.APPROVED
            : CHANGE_REQUEST_STATUS.REJECTED,
          reviewedById: context.id,
          reviewedAt: new Date(),
          reviewNote: note?.trim() || null,
        },
        { transaction: t },
      );
    });
    return this._get(id);
  }

  // Admin: the review queue. Staff: one registration's requests only.
  static async list(
    doc: TGetRegistrationChangeRequests,
    context: TContext,
  ): Promise<TPaginationGeneric<RegistrationChangeRequestModel>> {
    const where: WhereOptions = {};
    if (doc.status) Object.assign(where, { status: doc.status });
    if (doc.registrationId) {
      await RegistrationController.findIdCheck(doc.registrationId, context);
      Object.assign(where, { registrationId: doc.registrationId });
    } else {
      AdminController.assertPermission(context, PERMISSION.CHANGE_REQUEST_REVIEW);
    }
    return listPaginated(RegistrationChangeRequestModel, doc, {
      where,
      include: REQUEST_INCLUDE(AdminController.readFactory(context)),
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  private static _get(id: string): Promise<RegistrationChangeRequestModel> {
    return findOrThrow(RegistrationChangeRequestModel, id, "Хүсэлт олдсонгүй", {
      include: REQUEST_INCLUDE(),
    });
  }
}
