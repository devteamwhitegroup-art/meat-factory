import { Op, Transaction, WhereOptions, fn, col } from "sequelize";
import sequelize from "../../config/db-connection";
import { InventoryItemModel } from "../../models/inventory/inventory-item.model";
import { InventoryMovementModel } from "../../models/inventory/inventory-movement.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { SettingsController } from "../settings/settings.controller";
import { sendTelegramMessage } from "../../function/telegram";
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
import { findOrThrow, listPaginated } from "../../utils";

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

  private static _buildSku(line: TStockLine): string {
    if (line.productType === PRODUCT_TYPE.MEAT) {
      if (!line.animalType)
        throw new Error("Мах inventory line requires an animalType");
      if (line.byproductName)
        throw new Error("Мах inventory line cannot have a byproductName");
      return `Мах:${line.animalType}`;
    }
    if (line.animalType)
      throw new Error("Дайвар inventory line cannot have an animalType");
    // Byproducts are identified by their free-form catalogue name (Дайвар:<name>).
    const name = line.byproductName?.trim();
    if (!name) throw new Error("Дайвар line requires a byproductName");
    return `Дайвар:${name}`;
  }

  private static async _getOrCreateItem(
    line: TStockLine,
    t: Transaction,
  ): Promise<InventoryItemModel> {
    const sku = this._buildSku(line);
    await InventoryItemModel.findOrCreate({
      where: { sku },
      defaults: {
        sku,
        productType: line.productType,
        animalType: line.animalType ?? null,
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

  // Called by livestock when a registration's settlement is paid.
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
    const meatTypes = Array.from(
      new Set(
        payload.lines
          .filter((l) => l.productType === "MEAT" && l.animalType)
          .map((l) => l.animalType as string),
      ),
    );
    const yieldByType: Record<string, number> = {};
    if (meatTypes.length > 0) {
      const rows = await AnimalModel.findAll({
        where: { name: { [Op.in]: meatTypes } },
      });
      for (const r of rows) yieldByType[r.name] = Number(r.yieldPercent);
    }

    await sequelize.transaction(async (t) => {
      for (const l of payload.lines) {
        if (!l.quantityKg || l.quantityKg <= 0) continue;
        const isMeat = l.productType === "MEAT";
        const yieldPct =
          isMeat && l.animalType ? (yieldByType[l.animalType] ?? 100) : 100;
        const adjustedQty =
          yieldPct === 100
            ? l.quantityKg
            : Number(((l.quantityKg * yieldPct) / 100).toFixed(2));
        const line: TStockLine = {
          productType: isMeat ? PRODUCT_TYPE.MEAT : PRODUCT_TYPE.BYPRODUCT,
          animalType: l.animalType ?? null,
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

    // After the transaction commits, check whether the new meat total crossed
    // the storage threshold and notify via Telegram (fire-and-forget so the
    // settlement-paid response isn't blocked by a slow webhook).
    void this._maybeFireStorageAlert();
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

  // Inventory summary for the FE analytics block. Bundles totals + settings
  // + alert state in one round-trip so the page renders without a fan-out.
  static async stats(): Promise<{
    meatStockKg: number;
    byproductStockKg: number;
    meatCapacityKg: number;
    meatAlertThresholdKg: number;
    cargoCapacityKg: number;
    alertActive: boolean;
    cargosToClear: number;
    lastAlertedAt: Date | null;
  }> {
    const [meat, byprod, settings] = await Promise.all([
      this.totalKg(PRODUCT_TYPE.MEAT),
      this.totalKg(PRODUCT_TYPE.BYPRODUCT),
      SettingsController.get(),
    ]);
    const cap = Number(settings.cargoCapacityKg);
    const thr = Number(settings.meatAlertThresholdKg);
    return {
      meatStockKg: meat,
      byproductStockKg: byprod,
      meatCapacityKg: Number(settings.meatCapacityKg),
      meatAlertThresholdKg: thr,
      cargoCapacityKg: cap,
      alertActive: thr > 0 && meat >= thr,
      // ceil(meat / cargoCap). Returns 0 when cargoCap unset.
      cargosToClear: cap > 0 ? Math.ceil(meat / cap) : 0,
      lastAlertedAt: settings.lastAlertedAt,
    };
  }

  // Threshold-crossing check. Sends a Telegram message at most:
  //   - once per crossing (debounced by lastAlertedStockKg falling below
  //     threshold and re-rising), AND
  //   - at most once per 12h cool-down window.
  private static async _maybeFireStorageAlert(): Promise<void> {
    try {
      const settings = await SettingsController.get();
      const threshold = Number(settings.meatAlertThresholdKg);
      if (threshold <= 0) return; // alerts disabled
      const meatKg = await this.totalKg(PRODUCT_TYPE.MEAT);
      if (meatKg < threshold) return;
      const last = Number(settings.lastAlertedStockKg);
      const lastAt = settings.lastAlertedAt;
      const COOL_DOWN_MS = 12 * 60 * 60 * 1000;
      const tooSoon =
        lastAt && Date.now() - new Date(lastAt).getTime() < COOL_DOWN_MS;
      // Still above threshold after the previous alert AND inside the
      // cool-down window: stay quiet.
      if (last >= threshold && tooSoon) return;

      const cap = Number(settings.meatCapacityKg);
      const cargoCap = Number(settings.cargoCapacityKg);
      const cargosToClear = cargoCap > 0 ? Math.ceil(meatKg / cargoCap) : 0;
      const message =
        `<b>⚠️ Махны нөөц босго давсан</b>\n` +
        `Нөөц: <b>${meatKg.toFixed(2)} кг</b>` +
        (cap > 0 ? ` / ${cap.toFixed(0)} кг багтаамж` : "") +
        `\n` +
        `Босго: ${threshold.toFixed(0)} кг\n` +
        (cargoCap > 0 && cargosToClear > 0
          ? `Санал болгох ачилт: <b>${cargosToClear}</b> ачаа (1 ачаа ≈ ${cargoCap.toFixed(0)} кг)\n`
          : "") +
        `Шинэ ачилт үүсгэнэ үү.`;
      const ok = await sendTelegramMessage(message);
      if (ok) await SettingsController.stampAlert(meatKg);
    } catch (e) {
      console.error(
        "[inventory] storage alert hook error:",
        e instanceof Error ? e.message : "unknown",
      );
    }
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
      animalType: input.animalType ?? null,
      byproductName: input.byproductName ?? null,
      quantityKg: input.quantityKg,
    };
    const sku = this._buildSku(line);

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
    if (doc.animalType) Object.assign(where, { animalType: doc.animalType });
    if (doc.byproductName)
      Object.assign(where, { byproductName: doc.byproductName });

    return await InventoryItemModel.findAndCountAll({
      where,
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
    if (doc.dateRange?.startDate || doc.dateRange?.endDate) {
      const range: Record<symbol, Date> = {};
      if (doc.dateRange.startDate)
        range[Op.gte] = new Date(doc.dateRange.startDate);
      if (doc.dateRange.endDate)
        range[Op.lte] = new Date(doc.dateRange.endDate);
      Object.assign(where, { createdAt: range });
    }

    return listPaginated(InventoryMovementModel, doc, {
      where,
      include: [{ model: InventoryItemModel, as: "item" }],
      order: [["createdAt", "DESC"]],
    });
  }
}
