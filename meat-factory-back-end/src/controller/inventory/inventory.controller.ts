import { Op, Transaction, WhereOptions, fn, col } from "sequelize";
import sequelize from "../../config/db-connection";
import { InventoryItemModel } from "../../models/inventory/inventory-item.model";
import { InventoryMovementModel } from "../../models/inventory/inventory-movement.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { SettingsController } from "../settings/settings.controller";
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
// Type-only import (erased at runtime — no module cycle).
import type { TRegistrationIngestDTO } from "../../types/livestock/settlement.type";
import { TPaginationGeneric } from "../../types/global/global.type";
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
    await InventoryItemModel.findOrCreate({
      where: { sku },
      defaults: {
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
      where: { sku },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!locked) throw new Error(`Inventory item ${sku} disappeared`);
    return locked;
  }

  private static async _applyMovement(
    args: ApplyArgs,
    t: Transaction,
  ): Promise<InventoryMovementModel> {
    const { line } = args;
    if (!line.quantityKg || line.quantityKg <= 0)
      throw new Error("Movement quantity must be a positive number");

    const item = await this._getOrCreateItem(line, t);
    const current = Number(item.quantityKg);
    const qty = Number(line.quantityKg);
    const delta = args.movementType === MOVEMENT_TYPE.OUT ? -qty : qty;
    const newBalance = Number((current + delta).toFixed(2));

    if (newBalance < 0) {
      throw new Error(
        `Insufficient stock for ${item.sku}: have ${current}, need ${qty}`,
      );
    }

    await item.update({ quantityKg: newBalance }, { transaction: t });

    return await InventoryMovementModel.create(
      {
        inventoryItemId: item.id,
        movementType: args.movementType,
        source: args.source,
        quantityKg: qty,
        balanceAfterKg: newBalance,
        sourceRegistrationId: args.sourceRegistrationId ?? null,
        sourceShipmentId: args.sourceShipmentId ?? null,
        createdById: args.createdById ?? null,
        notes: args.notes ?? null,
      },
      { transaction: t },
    );
  }

  // Called by livestock right when byproducts are logged (ByproductLogController.
  // setRegistrationByproducts), for the non-coverable rows only — ownership
  // there is deterministic (always factory), so there's no reason to wait for
  // the whole verify → settle → pay pipeline. The rare "could cover slaughter
  // cost" rows stay on ingestFromSettledRegistration, gated by the verifier's
  // slaughterCoveredByByproduct decision.
  // ponytail: idempotent by "has anything been ingested for this registration
  // yet", not a per-edit diff — a second setRegistrationByproducts call with
  // different amounts won't adjust stock. Add reversal/delta tracking if that
  // edit case stops being rare.
  static async ingestNonCoverableByproducts(
    registrationId: string,
    lines: {
      animalId: string | null;
      byproductName: string;
      quantityKg: number;
    }[],
  ): Promise<void> {
    if (lines.length === 0) return;
    const already = await InventoryMovementModel.findOne({
      where: {
        source: MOVEMENT_SOURCE.BYPRODUCT,
        sourceRegistrationId: registrationId,
      },
    });
    if (already) return; // idempotent

    await sequelize.transaction(async (t) => {
      for (const l of lines) {
        if (!l.quantityKg || l.quantityKg <= 0) continue;
        await this._applyMovement(
          {
            movementType: MOVEMENT_TYPE.IN,
            source: MOVEMENT_SOURCE.BYPRODUCT,
            line: {
              productType: PRODUCT_TYPE.BYPRODUCT,
              animalId: l.animalId,
              byproductName: l.byproductName,
              quantityKg: l.quantityKg,
            },
            sourceRegistrationId: registrationId,
            notes: `Byproduct log ingest for registration ${registrationId}`,
          },
          t,
        );
      }
    });
  }

  // Called by VerificationController.verify() — meat is physically
  // slaughtered, weighed, and verified at this point, so it counts as
  // factory stock now, independent of when (or whether yet) the herder is
  // actually paid — settlement/payment can lag well behind. Runs in the
  // caller's transaction, same pattern as ShipmentController.updateStatus +
  // InventoryController.applyShipmentOut. Idempotent per registration via
  // MOVEMENT_SOURCE.VERIFICATION.
  static async ingestMeatFromVerifiedRegistration(
    registrationId: string,
    lines: { animalId: string; quantityKg: number }[],
    t: Transaction,
  ): Promise<void> {
    const already = await InventoryMovementModel.findOne({
      where: {
        source: MOVEMENT_SOURCE.VERIFICATION,
        sourceRegistrationId: registrationId,
      },
      transaction: t,
    });
    if (already) return; // idempotent

    const animalIds = Array.from(new Set(lines.map((l) => l.animalId)));
    const yieldById: Record<string, number> = {};
    if (animalIds.length > 0) {
      const rows = await AnimalModel.findAll({
        where: { id: { [Op.in]: animalIds } },
        transaction: t,
      });
      for (const r of rows) yieldById[r.id] = Number(r.yieldPercent);
    }

    for (const l of lines) {
      if (!l.quantityKg || l.quantityKg <= 0) continue;
      // Yield haircut — Animal.yieldPercent (default 100) so horse (70%)
      // stocks bone-out kg, not carcass kg.
      const yieldPct = yieldById[l.animalId] ?? 100;
      const adjustedQty =
        yieldPct === 100
          ? l.quantityKg
          : Number(((l.quantityKg * yieldPct) / 100).toFixed(2));
      const yieldNote =
        yieldPct !== 100
          ? ` (yield ${yieldPct}% from ${l.quantityKg} carcass kg)`
          : "";
      await this._applyMovement(
        {
          movementType: MOVEMENT_TYPE.IN,
          source: MOVEMENT_SOURCE.VERIFICATION,
          line: {
            productType: PRODUCT_TYPE.MEAT,
            animalId: l.animalId,
            byproductName: null,
            quantityKg: adjustedQty,
          },
          sourceRegistrationId: registrationId,
          notes: `Verification ingest for registration ${registrationId}${yieldNote}`,
        },
        t,
      );
    }
  }

  // Called by livestock when a registration's settlement is first paid —
  // ingests ONLY the rare coverable-byproduct case now (meat moved to
  // ingestMeatFromVerifiedRegistration above, fired at verification instead;
  // non-coverable byproducts already ingest at byproduct-save time via
  // MOVEMENT_SOURCE.BYPRODUCT). Kept generic by product type even though in
  // practice only BYPRODUCT lines reach it today.
  static async ingestFromSettledRegistration(
    payload: TRegistrationIngestDTO,
  ): Promise<void> {
    const already = await InventoryMovementModel.findOne({
      where: {
        source: MOVEMENT_SOURCE.SETTLEMENT,
        sourceRegistrationId: payload.registrationId,
      },
    });
    if (already) return; // idempotent

    // Yield haircut — Animal.yieldPercent (default 100) is applied to MEAT
    // lines so horse (70%) stocks bone-out kg, not carcass kg. Byproducts are
    // already weighed by the storekeeper and pass through unchanged.
    const meatAnimalIds = Array.from(
      new Set(
        payload.lines
          .filter((l) => l.productType === "MEAT" && l.animalId)
          .map((l) => l.animalId as string),
      ),
    );
    const yieldById: Record<string, number> = {};
    if (meatAnimalIds.length > 0) {
      const rows = await AnimalModel.findAll({
        where: { id: { [Op.in]: meatAnimalIds } },
      });
      for (const r of rows) yieldById[r.id] = Number(r.yieldPercent);
    }

    await sequelize.transaction(async (t) => {
      for (const l of payload.lines) {
        if (!l.quantityKg || l.quantityKg <= 0) continue;
        const isMeat = l.productType === "MEAT";
        const yieldPct =
          isMeat && l.animalId ? (yieldById[l.animalId] ?? 100) : 100;
        const adjustedQty =
          yieldPct === 100
            ? l.quantityKg
            : Number(((l.quantityKg * yieldPct) / 100).toFixed(2));
        const line: TStockLine = {
          productType: isMeat ? PRODUCT_TYPE.MEAT : PRODUCT_TYPE.BYPRODUCT,
          animalId: l.animalId ?? null,
          byproductName: l.byproductName ?? null,
          quantityKg: adjustedQty,
        };
        const yieldNote =
          isMeat && yieldPct !== 100
            ? ` (yield ${yieldPct}% from ${l.quantityKg} carcass kg)`
            : "";
        await this._applyMovement(
          {
            movementType: MOVEMENT_TYPE.IN,
            source: MOVEMENT_SOURCE.SETTLEMENT,
            line,
            sourceRegistrationId: payload.registrationId,
            notes: `Settlement ingest for registration ${payload.registrationId}${yieldNote}`,
          },
          t,
        );
      }
    });
  }

  // Total kg currently in stock for a product type. Used by the analytics
  // tile + the alert hook.
  static async totalKg(productType: PRODUCT_TYPE): Promise<number> {
    const row = (await InventoryItemModel.findOne({
      attributes: [[fn("SUM", col("quantity_kg")), "total"]],
      where: { productType },
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
  private static async _exportEligibleMeatKg(): Promise<number> {
    const rows = await InventoryItemModel.findAll({
      attributes: ["quantityKg"],
      where: { productType: PRODUCT_TYPE.MEAT },
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
  static async stats(): Promise<{
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
    const [meat, byprod, settings, exportEligibleMeatKg] = await Promise.all([
      this.totalKg(PRODUCT_TYPE.MEAT),
      this.totalKg(PRODUCT_TYPE.BYPRODUCT),
      SettingsController.get(),
      this._exportEligibleMeatKg(),
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
      if (!line.quantityKg || line.quantityKg <= 0) continue;
      await this._applyMovement(
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
    createdById: string,
  ): Promise<InventoryItemModel> {
    const line: TStockLine = {
      productType: input.productType,
      animalId: input.animalId ?? null,
      byproductName: input.byproductName ?? null,
      quantityKg: input.quantityKg,
    };
    const sku = await this._buildSku(line);

    await sequelize.transaction(async (t) => {
      await this._applyMovement(
        {
          movementType:
            input.direction === MOVEMENT_TYPE.OUT
              ? MOVEMENT_TYPE.OUT
              : MOVEMENT_TYPE.IN,
          source: MOVEMENT_SOURCE.MANUAL,
          line,
          createdById,
          notes: input.notes ?? null,
        },
        t,
      );
    });

    return (await InventoryItemModel.findOne({
      where: { sku },
    })) as InventoryItemModel;
  }

  // Stock-on-hand is a bounded reference set (one row per SKU), so it is
  // intentionally returned in full rather than paginated — the inventory
  // dashboard consumes the whole list for its meat/byproduct split.
  static async getStock(
    doc: TGetStock,
  ): Promise<TPaginationGeneric<InventoryItemModel>> {
    const where: WhereOptions = {};
    if (doc.productType) Object.assign(where, { productType: doc.productType });
    if (doc.animalId) Object.assign(where, { animalId: doc.animalId });
    if (doc.byproductName)
      Object.assign(where, { byproductName: doc.byproductName });

    return await InventoryItemModel.findAndCountAll({
      where,
      include: [{ model: AnimalModel, as: "animal" }],
      order: [["sku", "ASC"]],
    });
  }

  static async listMovements(
    doc: TGetMovements,
  ): Promise<TPaginationGeneric<InventoryMovementModel>> {
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
          include: [{ model: AnimalModel, as: "animal" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
}
