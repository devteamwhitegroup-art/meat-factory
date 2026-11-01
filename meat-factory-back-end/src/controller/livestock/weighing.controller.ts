import { Transaction, col, fn, literal } from "sequelize";
import { FactoryController } from "../factory/factory.controller";
import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { WeighingEntryAuditModel } from "../../models/livestock/weighing-entry-audit.model";
import { AnimalController } from "./animal.controller";
import { FileController } from "../global/file.controller";
import { RegistrationController } from "./registration.controller";
import { ByproductBundleController } from "./byproduct-bundle.controller";
import { InventoryController } from "../inventory/inventory.controller";
import { SettlementController } from "./settlement.controller";
import { findOrThrow, round2 } from "../../utils";
import {
  REGISTRATION_STATUS,
} from "../../types/livestock/registration.type";
import {
  MOVEMENT_SOURCE,
  TStockLine,
} from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import {
  TCreateWeighingEntry,
  TUpdateWeighingEntry,
  WEIGHING_AUDIT_ACTION,
} from "../../types/livestock/weighing-entry.type";
import { TContext } from "../../types/global/global.type";

// Weighing (Хэмжүүр) — sub-domain of the registration aggregate. Who may
// weigh when: RegistrationController.blocker("weigh").
export class WeighingController {
  // Σ kg and Σ kg × price per animal of a registration, in SQL. The one
  // source for the settlement meat amount, meat stock IN and costing.
  static async totalsByAnimal(
    registrationId: string,
    t?: Transaction,
  ): Promise<Map<string, { kg: number; amount: number }>> {
    const rows = (await WeighingEntryModel.findAll({
      attributes: [
        "animalId",
        [fn("SUM", col("weight_kg")), "kg"],
        [fn("SUM", literal("weight_kg * COALESCE(price_per_kg, 0)")), "amount"],
      ],
      where: { registrationId },
      group: ["animal_id"],
      raw: true,
      transaction: t,
    })) as unknown as { animalId: string; kg: string; amount: string }[];
    return new Map(
      rows.map((r) => [r.animalId, { kg: Number(r.kg), amount: Number(r.amount) }]),
    );
  }

  // Weighed kg per animal → MEAT stock lines (live: at verify; pre-butchered:
  // when weighing finishes).
  static async meatStockLines(
    registrationId: string,
    factory: string,
    t?: Transaction,
  ): Promise<TStockLine[]> {
    return [...(await this.totalsByAnimal(registrationId, t))].map(
      ([animalId, { kg }]) => ({
        factory,
        productType: PRODUCT_TYPE.MEAT,
        animalId,
        byproductName: null,
        quantityKg: round2(kg),
      }),
    );
  }

  // Weight > 0, price ≥ 0 (or absent). Shared by every weighing input.
  static assertValues(
    weightKg: number | null | undefined,
    pricePerKg: number | null | undefined,
  ): void {
    if (!(Number(weightKg) > 0)) throw new Error("Жин 0-ээс их байх ёстой");
    if (pricePerKg != null && !(Number(pricePerKg) >= 0))
      throw new Error("Үнэ сөрөг байж болохгүй");
  }

  // The animal (by catalogue name) must be one of the registration's lines.
  private static async _animalOnRegistration(
    registrationId: string,
    animalType: string,
    t?: Transaction,
  ): Promise<string> {
    const animal = await AnimalController.resolveByName(animalType);
    const line = await RegistrationAnimalLineModel.findOne({
      where: { registrationId, animalId: animal.id },
      transaction: t,
    });
    if (!line) throw new Error(`${animalType} бүртгэлийн малд алга`);
    return animal.id;
  }

  // Locked registration + "weigh" rule, inside the caller's transaction.
  private static async _editable(
    registrationId: string,
    context: TContext,
    t: Transaction,
  ): Promise<RegistrationModel> {
    const reg = await RegistrationController.lock(registrationId, context, t);
    RegistrationController.assertCan(reg, context, "weigh");
    return reg;
  }

  static async addWeighingEntry(
    doc: TCreateWeighingEntry,
    context: TContext,
  ): Promise<WeighingEntryModel> {
    const { registrationId, weightKg, pricePerKg } = doc;
    this.assertValues(weightKg, pricePerKg);
    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    return sequelize.transaction(async (t) => {
      const reg = await this._editable(registrationId, context, t);
      const animalId = await this._animalOnRegistration(
        registrationId,
        doc.animalType,
        t,
      );
      const [entry] = await this.insertEntries(
        [
          {
            registrationId,
            animalId,
            weightKg,
            pricePerKg: pricePerKg ?? null,
            photoFileId: doc.photoFileId ?? null,
          },
        ],
        context.id,
        t,
      );
      await SettlementController.recompute(reg, t);
      return entry;
    });
  }

  // Append entries (next sequence numbers) + their CREATE audit rows, in
  // bulk. Callers validate and hold the registration lock (or create it).
  static async insertEntries(
    rows: {
      registrationId: string;
      animalId: string;
      weightKg: number;
      pricePerKg: number | null;
      photoFileId: string | null;
    }[],
    actorId: string,
    t: Transaction,
  ): Promise<WeighingEntryModel[]> {
    if (!rows.length) return [];
    const maxSeq =
      ((await WeighingEntryModel.max("sequenceNo", {
        where: { registrationId: rows[0].registrationId },
        transaction: t,
      })) as number | null) ?? 0;
    const entries = await WeighingEntryModel.bulkCreate(
      rows.map((r, i) => ({
        ...r,
        sequenceNo: maxSeq + 1 + i,
        scaleOperatorId: actorId,
      })),
      { transaction: t, returning: true },
    );
    await WeighingEntryAuditModel.bulkCreate(
      entries.map((e) => ({
        registrationId: e.registrationId,
        weighingEntryId: e.id,
        action: WEIGHING_AUDIT_ACTION.CREATE,
        actorId,
        weightKgBefore: null,
        weightKgAfter: e.weightKg,
        pricePerKgBefore: null,
        pricePerKgAfter: e.pricePerKg,
      })),
      { transaction: t },
    );
    return entries;
  }

  static async finishWeighing(
    registrationId: string,
    context: TContext,
  ): Promise<RegistrationModel> {
    await sequelize.transaction(async (t) => {
      const reg = await RegistrationController.lock(registrationId, context, t);
      RegistrationController.assertCan(reg, context, "finishWeighing");
      const count = await WeighingEntryModel.count({
        where: { registrationId },
        transaction: t,
      });
      if (count === 0)
        throw new Error("Cannot finish weighing with no entries recorded");
      await reg.update(
        { status: REGISTRATION_STATUS.WEIGHED },
        { transaction: t },
      );
      // Live meat is stocked at verify instead.
      if (!FactoryController.rules(reg.factory).liveAnimals)
        await this.stockAtWeighing(registrationId, reg.factory, t);
    });
    return RegistrationController.getById(registrationId);
  }

  // Pre-butchered: no verify step — received meat + byproducts become stock
  // when weighing finishes (here, or on the intake form when it carries
  // weighings); finance settles with the herder later.
  static async stockAtWeighing(
    registrationId: string,
    factory: string,
    t: Transaction,
  ): Promise<void> {
    await InventoryController.ingestFromRegistration(
      registrationId,
      MOVEMENT_SOURCE.WEIGHING,
      await this.meatStockLines(registrationId, factory, t),
      t,
    );
    await InventoryController.ingestFromRegistration(
      registrationId,
      MOVEMENT_SOURCE.BYPRODUCT,
      ByproductBundleController.bundleStockLines(
        await ByproductBundleController.bundlesFor(registrationId, t),
        factory,
      ),
      t,
    );
  }

  private static async _logAudit(
    args: {
      registrationId: string;
      weighingEntryId: string;
      action: WEIGHING_AUDIT_ACTION;
      actorId: string;
      weightKgBefore: number | null;
      weightKgAfter: number | null;
      pricePerKgBefore: number | null;
      pricePerKgAfter: number | null;
    },
    t: Transaction,
  ): Promise<void> {
    await WeighingEntryAuditModel.create(args, { transaction: t });
  }

  // Admin-approved weight/price change from a registration change request —
  // same audit trail as a direct admin fix.
  static async setEntry(
    entry: WeighingEntryModel,
    weightKg: number,
    pricePerKg: number | null,
    actorId: string,
    t: Transaction,
  ): Promise<void> {
    const weightKgBefore = Number(entry.weightKg);
    const pricePerKgBefore = entry.pricePerKg;
    await entry.update({ weightKg, pricePerKg }, { transaction: t });
    await this._logAudit(
      {
        registrationId: entry.registrationId,
        weighingEntryId: entry.id,
        action: WEIGHING_AUDIT_ACTION.UPDATE,
        actorId,
        weightKgBefore,
        weightKgAfter: weightKg,
        pricePerKgBefore,
        pricePerKgAfter: pricePerKg,
      },
      t,
    );
  }

  // ponytail: a fix after the meat was stocked (verify / finishWeighing)
  // doesn't re-sync stock — only the settlement follows the new weights.
  static async updateWeighingEntry(
    doc: TUpdateWeighingEntry,
    context: TContext,
  ): Promise<WeighingEntryModel> {
    const found = await findOrThrow(
      WeighingEntryModel,
      doc.id,
      "Weighing entry not found",
    );
    if (doc.weightKg != null || doc.pricePerKg != null)
      this.assertValues(doc.weightKg ?? found.weightKg, doc.pricePerKg);
    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    return sequelize.transaction(async (t) => {
      const reg = await this._editable(found.registrationId, context, t);
      const entry = await found.reload({ transaction: t });
      const weightKgBefore = entry.weightKg;
      const pricePerKgBefore = entry.pricePerKg;
      if (doc.weightKg != null) entry.weightKg = doc.weightKg;
      if (doc.pricePerKg !== undefined) entry.pricePerKg = doc.pricePerKg ?? null;
      if (doc.animalType != null)
        entry.animalId = await this._animalOnRegistration(
          entry.registrationId,
          doc.animalType,
          t,
        );
      if (doc.photoFileId !== undefined)
        entry.photoFileId = doc.photoFileId ?? null;
      await entry.save({ transaction: t });
      await this._logAudit(
        {
          registrationId: entry.registrationId,
          weighingEntryId: entry.id,
          action: WEIGHING_AUDIT_ACTION.UPDATE,
          actorId: context.id,
          weightKgBefore,
          weightKgAfter: entry.weightKg,
          pricePerKgBefore,
          pricePerKgAfter: entry.pricePerKg,
        },
        t,
      );
      await SettlementController.recompute(reg, t);
      return entry;
    });
  }

  static async deleteWeighingEntry(
    id: string,
    context: TContext,
  ): Promise<void> {
    const entry = await findOrThrow(
      WeighingEntryModel,
      id,
      "Weighing entry not found",
    );
    await sequelize.transaction(async (t) => {
      const reg = await this._editable(entry.registrationId, context, t);
      await this._logAudit(
        {
          registrationId: entry.registrationId,
          weighingEntryId: entry.id,
          action: WEIGHING_AUDIT_ACTION.DELETE,
          actorId: context.id,
          weightKgBefore: entry.weightKg,
          weightKgAfter: null,
          pricePerKgBefore: entry.pricePerKg,
          pricePerKgAfter: null,
        },
        t,
      );
      await entry.destroy({ transaction: t });
      await SettlementController.recompute(reg, t);
    });
  }
}
