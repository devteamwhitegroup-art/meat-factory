import { Op, Transaction, WhereOptions } from 'sequelize';
import sequelize from '../../config/db-connection';
import { InventoryItemModel } from '../../models/inventory/inventory-item.model';
import { InventoryMovementModel } from '../../models/inventory/inventory-movement.model';
import {
  MOVEMENT_SOURCE,
  MOVEMENT_TYPE,
  TGetMovements,
  TGetStock,
  TManualAdjustInput,
  TShipmentOutDTO,
  TStockLine
} from '../../types/inventory/inventory.type';
import { PRODUCT_TYPE } from '../../types/sales/sales-transaction.type';
import {
  ANIMAL_TYPE,
  BYPRODUCT_TYPE
} from '../../types/livestock/registration.type';
// Type-only import (erased at runtime — no module cycle).
import type { TRegistrationIngestDTO } from '../../types/livestock/settlement.type';
import { TPaginationGeneric } from '../../types/global/global.type';
import { pagination } from '../../utils';

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
  static async findIdCheck(id: string): Promise<InventoryItemModel> {
    const item = await InventoryItemModel.findByPk(id);
    if (!item) throw new Error('Inventory item not found');
    return item;
  }

  private static _buildSku(line: TStockLine): string {
    if (line.productType === PRODUCT_TYPE.MEAT) {
      if (!line.animalType)
        throw new Error('MEAT inventory line requires an animalType');
      if (line.byproductType)
        throw new Error('MEAT inventory line cannot have a byproductType');
      return `MEAT:${line.animalType}`;
    }
    if (!line.byproductType)
      throw new Error('BYPRODUCT inventory line requires a byproductType');
    if (line.animalType)
      throw new Error('BYPRODUCT inventory line cannot have an animalType');
    return `BYPRODUCT:${line.byproductType}`;
  }

  private static async _getOrCreateItem(
    line: TStockLine,
    t: Transaction
  ): Promise<InventoryItemModel> {
    const sku = this._buildSku(line);
    await InventoryItemModel.findOrCreate({
      where: { sku },
      defaults: {
        sku,
        productType: line.productType,
        animalType: line.animalType ?? null,
        byproductType: line.byproductType ?? null,
        quantityKg: 0
      },
      transaction: t
    });
    // Re-read with a row lock to serialize concurrent movements.
    const locked = await InventoryItemModel.findOne({
      where: { sku },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!locked) throw new Error(`Inventory item ${sku} disappeared`);
    return locked;
  }

  private static async _applyMovement(
    args: ApplyArgs,
    t: Transaction
  ): Promise<InventoryMovementModel> {
    const { line } = args;
    if (!line.quantityKg || line.quantityKg <= 0)
      throw new Error('Movement quantity must be a positive number');

    const item = await this._getOrCreateItem(line, t);
    const current = Number(item.quantityKg);
    const qty = Number(line.quantityKg);
    const delta = args.movementType === MOVEMENT_TYPE.OUT ? -qty : qty;
    const newBalance = Number((current + delta).toFixed(2));

    if (newBalance < 0) {
      throw new Error(
        `Insufficient stock for ${item.sku}: have ${current}, need ${qty}`
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
        notes: args.notes ?? null
      },
      { transaction: t }
    );
  }

  // Called by livestock when a registration's settlement is paid.
  static async ingestFromSettledRegistration(
    payload: TRegistrationIngestDTO
  ): Promise<void> {
    const already = await InventoryMovementModel.findOne({
      where: {
        source: MOVEMENT_SOURCE.SETTLEMENT,
        sourceRegistrationId: payload.registrationId
      }
    });
    if (already) return; // idempotent

    await sequelize.transaction(async (t) => {
      for (const l of payload.lines) {
        if (!l.quantityKg || l.quantityKg <= 0) continue;
        const line: TStockLine = {
          productType:
            l.productType === 'MEAT'
              ? PRODUCT_TYPE.MEAT
              : PRODUCT_TYPE.BYPRODUCT,
          animalType: (l.animalType as ANIMAL_TYPE | null) ?? null,
          byproductType: (l.byproductType as BYPRODUCT_TYPE | null) ?? null,
          quantityKg: l.quantityKg
        };
        await this._applyMovement(
          {
            movementType: MOVEMENT_TYPE.IN,
            source: MOVEMENT_SOURCE.SETTLEMENT,
            line,
            sourceRegistrationId: payload.registrationId,
            notes: `Settlement ingest for registration ${payload.registrationId}`
          },
          t
        );
      }
    });
  }

  // Called by ShipmentController when a shipment is delivered. Runs in
  // the caller's transaction so stock-out is atomic with the status change.
  static async applyShipmentOut(
    dto: TShipmentOutDTO,
    t: Transaction
  ): Promise<void> {
    const already = await InventoryMovementModel.findOne({
      where: {
        source: MOVEMENT_SOURCE.SHIPMENT,
        sourceShipmentId: dto.shipmentId
      },
      transaction: t
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
          notes: `Shipment out ${dto.shipmentId}`
        },
        t
      );
    }
  }

  static async manualAdjust(
    input: TManualAdjustInput,
    createdById: string
  ): Promise<InventoryItemModel> {
    const line: TStockLine = {
      productType: input.productType,
      animalType: input.animalType ?? null,
      byproductType: input.byproductType ?? null,
      quantityKg: input.quantityKg
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
          notes: input.notes ?? null
        },
        t
      );
    });

    return (await InventoryItemModel.findOne({
      where: { sku }
    })) as InventoryItemModel;
  }

  static async getStock(
    doc: TGetStock
  ): Promise<TPaginationGeneric<InventoryItemModel>> {
    const where: WhereOptions = {};
    if (doc.productType) Object.assign(where, { productType: doc.productType });
    if (doc.animalType) Object.assign(where, { animalType: doc.animalType });
    if (doc.byproductType)
      Object.assign(where, { byproductType: doc.byproductType });

    return await InventoryItemModel.findAndCountAll({
      where,
      order: [['sku', 'ASC']]
    });
  }

  static async listMovements(
    doc: TGetMovements
  ): Promise<TPaginationGeneric<InventoryMovementModel>> {
    const { offset, limit } = pagination(doc);
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

    return await InventoryMovementModel.findAndCountAll({
      where,
      include: [{ model: InventoryItemModel, as: 'item' }],
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
  }
}
