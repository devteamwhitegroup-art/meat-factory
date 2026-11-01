import { Op, Transaction, WhereOptions, fn, col, literal } from "sequelize";
import sequelize from "../../config/db-connection";
import { InventoryItemModel } from "../../models/inventory/inventory-item.model";
import { InventoryMovementModel } from "../../models/inventory/inventory-movement.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { ShipmentModel } from "../../models/shipment/shipment.model";
import { ShipmentCargoEntryModel } from "../../models/shipment/shipment-cargo-entry.model";
import { SHIPMENT_STATUS, TShipmentStockRow } from "../../types/shipment/shipment.type";
import { SettingsController } from "../settings/settings.controller";
import { AdminController } from "../user/admin.controller";
import { AnimalController } from "../livestock/animal.controller";
import {
  MOVEMENT_SOURCE,
  MOVEMENT_TYPE,
  TGetMovements,
  TGetStock,
  TManualAdjustInput,
  TShipmentOutDTO,
  TStockLine,
} from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { dateRangeWhere, findOrThrow, listPaginated, round2 } from "../../utils";

type ApplyArgs = {
  movementType: MOVEMENT_TYPE;
  source: MOVEMENT_SOURCE;
  line: TStockLine;
  sourceRegistrationId?: string | null;
  sourceShipmentId?: string | null;
  createdById?: string | null;
  notes?: string | null;
};

type TProduct = {
  productType: PRODUCT_TYPE;
  animalId?: string | null;
  byproductName?: string | null;
};

// THE identity of a stocked product, shared by InventoryItem.sku, shipment
// cargo groups (ShipmentSaleLine.groupKey) and availability:
//   MEAT:<animalId> | BYPN:<animalId>:<name> | BYPN:<name> (animal-less).
// Built from ids, never names — renaming an animal can't split its stock.
// Same-named byproducts of different animals (horse vs cow "Зүрх") stay apart.
export function stockKey(p: TProduct): string {
  if (p.productType === PRODUCT_TYPE.MEAT) {
    if (!p.animalId) throw new Error("Махны мөрөнд малын төрөл шаардлагатай");
    if (p.byproductName) throw new Error("Махны мөрөнд дайврын нэр байхгүй");
    return `MEAT:${p.animalId}`;
  }
  const name = p.byproductName?.trim();
  if (!name) throw new Error("Дайврын мөрөнд нэр шаардлагатай");
  return `BYPN:${p.animalId ? `${p.animalId}:` : ""}${name}`;
}

// Human label for the same product: "Адуу мах" / "Адуу Зүрх" / "Зүрх".
export function stockLabel(p: {
  productType: PRODUCT_TYPE;
  animalName?: string | null;
  byproductName?: string | null;
}): string {
  return p.productType === PRODUCT_TYPE.MEAT
    ? `${p.animalName ?? ""} мах`.trim()
    : [p.animalName, p.byproductName].filter(Boolean).join(" ");
}

export class InventoryController {
  private static async _getOrCreateItem(
    line: TStockLine,
    t: Transaction,
  ): Promise<InventoryItemModel> {
    const sku = stockKey(line);
    const where = { factory: line.factory, sku };
    const [item] = await InventoryItemModel.findOrCreate({
      where,
      defaults: {
        factory: line.factory,
        sku,
        productType: line.productType,
        animalId: line.animalId ?? null,
        byproductName: line.byproductName?.trim() || null,
        quantityKg: 0,
      },
      transaction: t,
    });
    // Re-read under a row lock to serialize concurrent movements.
    return item.reload({ transaction: t, lock: t.LOCK.UPDATE });
  }

  // Loadable stock per product at a factory: on hand − cargo on every
  // undelivered shipment (stock only leaves the ledger at DELIVERED). Shipment
  // cargo and factory transfers check against it.
  // ponytail: no lock — two loaders racing can both pass; the ledger check at
  // DELIVERED stays the final guard (and LOADED → PENDING the way back).
  static async available(
    factory: string,
    t?: Transaction,
  ): Promise<Map<string, TShipmentStockRow>> {
    type Row = TProduct & { kg: string | number };
    const [items, cargo] = await Promise.all([
      InventoryItemModel.findAll({
        attributes: [
          "productType",
          "animalId",
          "byproductName",
          [col("quantity_kg"), "kg"],
        ],
        where: { factory },
        raw: true,
        transaction: t,
      }) as unknown as Promise<Row[]>,
      ShipmentCargoEntryModel.findAll({
        attributes: [
          "productType",
          "animalId",
          "byproductName",
          // Qualified: the joined Shipments has a weight_kg too.
          [fn("SUM", col("ShipmentCargoEntryModel.weight_kg")), "kg"],
        ],
        include: [
          {
            model: ShipmentModel,
            as: "shipment",
            attributes: [],
            required: true,
            where: { factory, status: { [Op.ne]: SHIPMENT_STATUS.DELIVERED } },
          },
        ],
        group: ["product_type", "animal_id", "byproduct_name"],
        raw: true,
        transaction: t,
      }) as unknown as Promise<Row[]>,
    ]);
    const names = await AnimalController.namesById(
      [...items, ...cargo].map((r) => r.animalId),
    );
    const rows = new Map<string, TShipmentStockRow>();
    const row = (p: TProduct) => {
      const groupKey = stockKey(p);
      const r = rows.get(groupKey) ?? {
        groupKey,
        productType: p.productType,
        animalId: p.animalId ?? null,
        animalType: p.animalId ? (names.get(p.animalId) ?? null) : null,
        byproductName: p.byproductName ?? null,
        onHandKg: 0,
        reservedKg: 0,
        availableKg: 0,
      };
      rows.set(groupKey, r);
      return r;
    };
    for (const i of items) row(i).onHandKg += Number(i.kg);
    for (const c of cargo) row(c).reservedKg += Number(c.kg);
    for (const r of rows.values()) {
      r.onHandKg = round2(r.onHandKg);
      r.reservedKg = round2(r.reservedKg);
      r.availableKg = round2(r.onHandKg - r.reservedKg);
    }
    return rows;
  }

  // Single stock primitive: one IN/OUT on one SKU under a row lock, kg and/or
  // pieces, never below zero. Runs in the caller's transaction.
  static async applyMovement(
    args: ApplyArgs,
    t: Transaction,
  ): Promise<InventoryMovementModel> {
    const { line } = args;
    const qty = Number(line.quantityKg ?? 0);
    const cnt = Math.floor(Number(line.quantityCount ?? 0));
    if (qty < 0 || cnt < 0 || (qty <= 0 && cnt <= 0))
      throw new Error("Movement quantity must be a positive number");

    const item = await this._getOrCreateItem(line, t);
    const sign = args.movementType === MOVEMENT_TYPE.OUT ? -1 : 1;
    const current = Number(item.quantityKg);
    const currentCount = Number(item.quantityCount);
    const newBalance = round2(current + sign * qty);
    const newCount = currentCount + sign * cnt;

    if (newBalance < 0)
      throw new Error(
        `Insufficient stock for ${item.sku}: have ${current} kg, need ${qty} kg`,
      );
    if (newCount < 0)
      throw new Error(
        `Insufficient stock for ${item.sku}: have ${currentCount} ш, need ${cnt} ш`,
      );

    await item.update(
      { quantityKg: newBalance, quantityCount: newCount },
      { transaction: t },
    );

    return await InventoryMovementModel.create(
      {
        inventoryItemId: item.id,
        movementType: args.movementType,
        source: args.source,
        quantityKg: qty,
        balanceAfterKg: newBalance,
        quantityCount: cnt,
        balanceAfterCount: newCount,
        sourceRegistrationId: args.sourceRegistrationId ?? null,
        sourceShipmentId: args.sourceShipmentId ?? null,
        createdById: args.createdById ?? null,
        notes: args.notes ?? null,
      },
      { transaction: t },
    );
  }

  // Livestock → stock IN, in the caller's transaction. Idempotent per
  // (source, registration). MEAT lines get the Animal.yieldPercent haircut so
  // e.g. horse (70%) stocks bone-out kg, not carcass kg. Callers:
  //   VERIFICATION — FACTORY_1 meat at verify (VerificationController.verify)
  //   BYPRODUCT    — FACTORY_1 kept items at settlement creation;
  //                  FACTORY_2 гэдэс at finishWeighing
  //   WEIGHING     — FACTORY_2 pre-butchered meat at finishWeighing
  static async ingestFromRegistration(
    registrationId: string,
    source: MOVEMENT_SOURCE,
    lines: TStockLine[],
    t: Transaction,
  ): Promise<void> {
    if (lines.length === 0) return;
    const already = await InventoryMovementModel.findOne({
      where: { source, sourceRegistrationId: registrationId },
      transaction: t,
    });
    if (already) return; // idempotent

    const meatIds = lines
      .filter((l) => l.productType === PRODUCT_TYPE.MEAT && l.animalId)
      .map((l) => l.animalId as string);
    const yieldById = new Map(
      meatIds.length
        ? (
            await AnimalModel.findAll({
              where: { id: { [Op.in]: meatIds } },
              transaction: t,
            })
          ).map((r) => [r.id, Number(r.yieldPercent)])
        : [],
    );

    for (const l of lines) {
      if (!(l.quantityKg > 0) && !((l.quantityCount ?? 0) > 0)) continue;
      const yieldPct =
        l.productType === PRODUCT_TYPE.MEAT && l.animalId
          ? (yieldById.get(l.animalId) ?? 100)
          : 100;
      const quantityKg =
        yieldPct === 100 ? l.quantityKg : round2((l.quantityKg * yieldPct) / 100);
      const yieldNote =
        yieldPct !== 100
          ? ` (yield ${yieldPct}% from ${l.quantityKg} carcass kg)`
          : "";
      await this.applyMovement(
        {
          movementType: MOVEMENT_TYPE.IN,
          source,
          line: { ...l, quantityKg },
          sourceRegistrationId: registrationId,
          notes: `${source} ingest for registration ${registrationId}${yieldNote}`,
        },
        t,
      );
    }
  }

  // kg on hand per product type, plus the export-eligible meat — the full
  // physical total of export-flagged animals (not reduced by what's on a
  // truck), so admin can call an export cargo once it crosses the threshold.
  // Domestic shipments accept ANY meat, so domestic-available = all meat.
  // One scan: SUM … GROUP BY product_type.
  private static async _totals(factory: string | null) {
    const rows = (await InventoryItemModel.findAll({
      attributes: [
        "productType",
        [fn("SUM", col("quantity_kg")), "kg"],
        [
          fn(
            "SUM",
            literal(
              `CASE WHEN "animal"."is_export" THEN "InventoryItemModel"."quantity_kg" ELSE 0 END`,
            ),
          ),
          "exportKg",
        ],
      ],
      where: factory ? { factory } : {},
      include: [{ model: AnimalModel, as: "animal", attributes: [] }],
      group: ["product_type"],
      raw: true,
    })) as unknown as {
      productType: PRODUCT_TYPE;
      kg: string;
      exportKg: string;
    }[];
    const of = (p: PRODUCT_TYPE) => rows.find((r) => r.productType === p);
    const meat = of(PRODUCT_TYPE.MEAT);
    return {
      meat: round2(Number(meat?.kg ?? 0)),
      byproduct: round2(Number(of(PRODUCT_TYPE.BYPRODUCT)?.kg ?? 0)),
      exportEligible: round2(Number(meat?.exportKg ?? 0)),
    };
  }

  // Inventory summary for the FE analytics block. Bundles totals + settings
  // + alert state in one round-trip so the page renders without a fan-out.
  // ponytail: capacity/alert thresholds stay global settings, compared against
  // the scoped stock — split them per factory if the two sites differ.
  static async stats(
    context: TContext,
    requested?: string | null,
  ): Promise<{
    meatStockKg: number;
    byproductStockKg: number;
    meatCapacityKg: number;
    exportEligibleMeatKg: number;
    domesticAvailableMeatKg: number;
    exportAlertThresholdKg: number;
    domesticAlertThresholdKg: number;
    exportAlertActive: boolean;
    domesticAlertActive: boolean;
  }> {
    const factory = AdminController.readFactory(context, requested);
    const [totals, settings] = await Promise.all([
      this._totals(factory),
      SettingsController.get(),
    ]);
    const { meat, exportEligible: exportEligibleMeatKg } = totals;
    const exportThr = Number(settings.exportAlertThresholdKg);
    const domesticThr = Number(settings.domesticAlertThresholdKg);
    return {
      meatStockKg: meat,
      byproductStockKg: totals.byproduct,
      meatCapacityKg: Number(settings.meatCapacityKg),
      exportEligibleMeatKg,
      // Domestic shipments accept any meat (export-eligible or not), so the
      // domestic-available pool is the full meat total, not a subset.
      domesticAvailableMeatKg: meat,
      exportAlertThresholdKg: exportThr,
      domesticAlertThresholdKg: domesticThr,
      exportAlertActive: exportThr > 0 && exportEligibleMeatKg >= exportThr,
      domesticAlertActive: domesticThr > 0 && meat >= domesticThr,
    };
  }

  // Called by ShipmentController when a shipment is delivered. Runs in
  // the caller's transaction so stock-out is atomic with the status change.
  static async applyShipmentOut(
    dto: TShipmentOutDTO,
    t: Transaction,
  ): Promise<void> {
    const already = await InventoryMovementModel.findOne({
      where: {
        source: MOVEMENT_SOURCE.SHIPMENT,
        sourceShipmentId: dto.shipmentId,
      },
      transaction: t,
    });
    if (already) return; // idempotent

    for (const line of dto.lines) {
      if (!line.quantityKg || line.quantityKg <= 0) continue; // shipments are kg
      await this.applyMovement(
        {
          movementType: MOVEMENT_TYPE.OUT,
          source: MOVEMENT_SOURCE.SHIPMENT,
          line,
          sourceShipmentId: dto.shipmentId,
          notes: `Shipment out ${dto.shipmentId}`,
        },
        t,
      );
    }
  }

  static async manualAdjust(
    input: TManualAdjustInput,
    context: TContext,
  ): Promise<InventoryItemModel> {
    const factory = AdminController.writeFactory(context, input.factory);
    const line: TStockLine = {
      factory,
      productType: input.productType,
      animalId: input.animalId ?? null,
      byproductName: input.byproductName ?? null,
      quantityKg: Number(input.quantityKg ?? 0),
      quantityCount: Number(input.quantityCount ?? 0),
    };
    const movement = await sequelize.transaction((t) =>
      this.applyMovement(
        {
          movementType:
            input.direction === MOVEMENT_TYPE.OUT
              ? MOVEMENT_TYPE.OUT
              : MOVEMENT_TYPE.IN,
          source: MOVEMENT_SOURCE.MANUAL,
          line,
          createdById: context.id,
          notes: input.notes ?? null,
        },
        t,
      ),
    );
    return findOrThrow(InventoryItemModel, movement.inventoryItemId, "Олдсонгүй", {
      include: [{ model: AnimalModel, as: "animal" }],
    });
  }

  // Stock-on-hand is a bounded reference set (one row per SKU), so it is
  // intentionally returned in full rather than paginated — the inventory
  // dashboard consumes the whole list for its meat/byproduct split.
  static async getStock(
    doc: TGetStock,
    context: TContext,
  ): Promise<TPaginationGeneric<InventoryItemModel>> {
    const where: WhereOptions = {};
    const factory = AdminController.readFactory(context, doc.factory);
    if (factory) Object.assign(where, { factory });
    if (doc.productType) Object.assign(where, { productType: doc.productType });
    if (doc.animalId) Object.assign(where, { animalId: doc.animalId });
    if (doc.byproductName)
      Object.assign(where, { byproductName: doc.byproductName });

    return await InventoryItemModel.findAndCountAll({
      where,
      include: [{ model: AnimalModel, as: "animal" }],
      order: [
        ["factory", "ASC"],
        ["sku", "ASC"],
      ],
    });
  }

  static async listMovements(
    doc: TGetMovements,
    context: TContext,
  ): Promise<TPaginationGeneric<InventoryMovementModel>> {
    const factory = AdminController.readFactory(context, doc.factory);
    const where: WhereOptions = {};
    if (doc.inventoryItemId)
      Object.assign(where, { inventoryItemId: doc.inventoryItemId });
    if (doc.movementType)
      Object.assign(where, { movementType: doc.movementType });
    if (doc.source) Object.assign(where, { source: doc.source });
    Object.assign(where, dateRangeWhere(doc.dateRange, "createdAt"));

    return listPaginated(InventoryMovementModel, doc, {
      where,
      include: [
        {
          model: InventoryItemModel,
          as: "item",
          where: {
            ...(factory ? { factory } : {}),
            ...(doc.productType ? { productType: doc.productType } : {}),
          },
          required: !!factory || !!doc.productType,
          include: [{ model: AnimalModel, as: "animal" }],
        },
        // Source links for the log (was one lookup per row per field).
        {
          model: RegistrationModel,
          as: "registration",
          attributes: ["registrationCode"],
        },
        { model: ShipmentModel, as: "shipment", attributes: ["shipmentCode"] },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }
}
