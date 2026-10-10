import { Op, Transaction, WhereOptions, fn, col } from "sequelize";
import sequelize from "../../config/db-connection";
import { InventoryItemModel } from "../../models/inventory/inventory-item.model";
import { InventoryMovementModel } from "../../models/inventory/inventory-movement.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { SettingsController } from "../settings/settings.controller";
import { AdminController } from "../user/admin.controller";
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
import { FACTORY } from "../../types/user/admin.type";
import { dateRangeWhere, findOrThrow, listPaginated } from "../../utils";

type ApplyArgs = {
  movementType: MOVEMENT_TYPE;
  source: MOVEMENT_SOURCE;
  line: TStockLine;
  sourceRegistrationId?: string | null;
  sourceShipmentId?: string | null;
  createdById?: string | null;
  notes?: string | null;
};

export class InventoryController {
  static findIdCheck(id: string): Promise<InventoryItemModel> {
    return findOrThrow(InventoryItemModel, id, "Inventory item not found");
  }

  // SKU stays human-readable (embeds the animal name), even though identity
  // is now the FK — resolve the name once via a lookup rather than storing
  // it, so a catalogue rename can't desync the two.
  private static async _buildSku(
    line: TStockLine,
    t?: Transaction,
  ): Promise<string> {
    if (line.productType === PRODUCT_TYPE.MEAT) {
      if (!line.animalId)
        throw new Error("Мах inventory line requires an animalId");
      if (line.byproductName)
        throw new Error("Мах inventory line cannot have a byproductName");
      const animal = await findOrThrow(
        AnimalModel,
        line.animalId,
        "Малын төрөл олдсонгүй",
        t ? { transaction: t } : undefined,
      );
      return `Мах:${animal.name}`;
    }
    const name = line.byproductName?.trim();
    if (!name) throw new Error("Дайвар line requires a byproductName");
    // Animal is optional on a byproduct line (some free-form rows aren't
    // tied to one, matching ByproductLog.animalId), but when present it
    // must be part of the SKU — otherwise two different animals' same-named
    // byproducts (e.g. horse "Зүрх" vs cow "Зүрх") collide into one
    // inventory line instead of staying separate stock.
    if (!line.animalId) return `Дайвар:${name}`;
    const animal = await findOrThrow(
      AnimalModel,
      line.animalId,
      "Малын төрөл олдсонгүй",
      t ? { transaction: t } : undefined,
    );
    return `Дайвар:${animal.name}:${name}`;
  }

  private static async _getOrCreateItem(
    line: TStockLine,
    t: Transaction,
  ): Promise<InventoryItemModel> {
    const sku = await this._buildSku(line, t);
    const where = { factory: line.factory, sku };
    await InventoryItemModel.findOrCreate({
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
    // Re-read with a row lock to serialize concurrent movements.
    const locked = await InventoryItemModel.findOne({
      where,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!locked) throw new Error(`Inventory item ${sku} disappeared`);
    return locked;
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
    const newBalance = Number((current + sign * qty).toFixed(2));
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

    const meatIds = Array.from(
      new Set(
        lines
          .filter((l) => l.productType === PRODUCT_TYPE.MEAT && l.animalId)
          .map((l) => l.animalId as string),
      ),
    );
    const yieldById: Record<string, number> = {};
    if (meatIds.length > 0) {
      const rows = await AnimalModel.findAll({
        where: { id: { [Op.in]: meatIds } },
        transaction: t,
      });
      for (const r of rows) yieldById[r.id] = Number(r.yieldPercent);
    }

    for (const l of lines) {
      if (!(l.quantityKg > 0) && !((l.quantityCount ?? 0) > 0)) continue;
      const yieldPct =
        l.productType === PRODUCT_TYPE.MEAT && l.animalId
          ? (yieldById[l.animalId] ?? 100)
          : 100;
      const quantityKg =
        yieldPct === 100
          ? l.quantityKg
          : Number(((l.quantityKg * yieldPct) / 100).toFixed(2));
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

  // Total kg currently in stock for a product type. Used by the analytics
  // tile + the alert hook.
  static async totalKg(
    productType: PRODUCT_TYPE,
    factory: FACTORY | null,
  ): Promise<number> {
    const row = (await InventoryItemModel.findOne({
      attributes: [[fn("SUM", col("quantity_kg")), "total"]],
      where: factory ? { productType, factory } : { productType },
      raw: true,
    })) as unknown as { total: string | null } | null;
    return Number(row?.total ?? 0);
  }

  // Meat kg eligible for an EXPORT shipment — the full physical total (not
  // reduced by what's already loaded on a truck), so admin sees "of
  // everything in storage, how much could go export?" and can call a cargo
  // once it crosses the export threshold. Export shipments only accept
  // export-flagged animals (ShipmentController.addCargoEntry); domestic
  // shipments accept ANY meat, so there is no separate "domestic-only"
  // split — the domestic-available figure is just the full meat total.
  private static async _exportEligibleMeatKg(
    factory: FACTORY | null,
  ): Promise<number> {
    const rows = await InventoryItemModel.findAll({
      attributes: ["quantityKg"],
      where: factory
        ? { productType: PRODUCT_TYPE.MEAT, factory }
        : { productType: PRODUCT_TYPE.MEAT },
      include: [{ model: AnimalModel, as: "animal", attributes: ["isExport"] }],
    });
    let exportEligible = 0;
    for (const r of rows) {
      if (r.animal?.isExport) exportEligible += Number(r.quantityKg);
    }
    return Number(exportEligible.toFixed(2));
  }

  // Inventory summary for the FE analytics block. Bundles totals + settings
  // + alert state in one round-trip so the page renders without a fan-out.
  // ponytail: capacity/alert thresholds stay global settings, compared against
  // the scoped stock — split them per factory if the two sites differ.
  static async stats(
    context: TContext,
    requested?: FACTORY | null,
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
    const [meat, byprod, settings, exportEligibleMeatKg] = await Promise.all([
      this.totalKg(PRODUCT_TYPE.MEAT, factory),
      this.totalKg(PRODUCT_TYPE.BYPRODUCT, factory),
      SettingsController.get(),
      this._exportEligibleMeatKg(factory),
    ]);
    const exportThr = Number(settings.exportAlertThresholdKg);
    const domesticThr = Number(settings.domesticAlertThresholdKg);
    return {
      meatStockKg: meat,
      byproductStockKg: byprod,
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
    const sku = await this._buildSku(line);

    await sequelize.transaction(async (t) => {
      await this.applyMovement(
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
      );
    });

    return (await InventoryItemModel.findOne({
      where: { factory, sku },
    })) as InventoryItemModel;
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
          where: factory ? { factory } : undefined,
          required: !!factory,
          include: [{ model: AnimalModel, as: "animal" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
}
