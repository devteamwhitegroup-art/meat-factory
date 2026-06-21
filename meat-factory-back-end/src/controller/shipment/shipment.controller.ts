import {
  Op,
  UniqueConstraintError,
  WhereOptions
} from 'sequelize';
import sequelize from '../../config/db-connection';
import { ShipmentModel } from '../../models/shipment/shipment.model';
import { ShipmentCargoEntryModel } from '../../models/shipment/shipment-cargo-entry.model';
import { ShipmentPhotoModel } from '../../models/shipment/shipment-photo.model';
import { CustomerModel } from '../../models/customer/customer.model';
import { SalesTransactionModel } from '../../models/sales/sales-transaction.model';
import { SalesLineItemModel } from '../../models/sales/sales-line-item.model';
import { FileModel } from '../../models/global/file.model';
import { AdminModel } from '../../models/user/admin.model';
import {
  SHIPMENT_STATUS,
  TCreateShipment,
  TGetShipments,
  TShipment
} from '../../types/shipment/shipment.type';
import { TStockLine } from '../../types/inventory/inventory.type';
import { PRODUCT_TYPE } from '../../types/sales/sales-transaction.type';
import { TContext, TPaginationGeneric } from '../../types/global/global.type';
import { CustomerController } from '../customer/customer.controller';
import { SalesTransactionController } from '../sales/sales-transaction.controller';
import { InventoryController } from '../inventory/inventory.controller';
import { FileController } from '../global/file.controller';
import { findOrThrow, listPaginated } from '../../utils';

const MAX_CODE_RETRIES = 5;

const FORWARD: Record<SHIPMENT_STATUS, SHIPMENT_STATUS | null> = {
  [SHIPMENT_STATUS.PENDING]: SHIPMENT_STATUS.LOADED,
  [SHIPMENT_STATUS.LOADED]: SHIPMENT_STATUS.DELIVERED,
  [SHIPMENT_STATUS.DELIVERED]: null
};

export class ShipmentController {
  static findIdCheck(id: string): Promise<ShipmentModel> {
    return findOrThrow(ShipmentModel, id, 'Shipment not found');
  }

  private static _rand4(): number {
    return Math.floor(1000 + Math.random() * 9000);
  }

  private static _generateCode(): string {
    return `${this._rand4()}-${this._rand4()}`;
  }

  static async create(
    doc: TCreateShipment,
    context: TContext
  ): Promise<ShipmentModel> {
    if (!doc.customerId && !doc.salesTransactionId)
      throw new Error('Customer or sales transaction is required');
    if (!doc.weightKg || doc.weightKg <= 0)
      throw new Error('Weight must be a positive number');

    if (doc.customerId) await CustomerController.findIdCheck(doc.customerId);
    if (doc.salesTransactionId)
      await SalesTransactionController.findIdCheck(doc.salesTransactionId);
    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      try {
        return await ShipmentModel.create({
          shipmentCode: this._generateCode(),
          customerId: doc.customerId ?? null,
          salesTransactionId: doc.salesTransactionId ?? null,
          weightKg: doc.weightKg,
          status: SHIPMENT_STATUS.PENDING,
          loadedById: context.id,
          vehiclePlate: doc.vehiclePlate?.trim() || null,
          driverName: doc.driverName?.trim() || null,
          driverPhone: doc.driverPhone?.trim() || null,
          serialNumber: doc.serialNumber?.trim() || null,
          notes: doc.notes ?? null,
          photoFileId: doc.photoFileId ?? null
        });
      } catch (err) {
        if (
          err instanceof UniqueConstraintError &&
          attempt < MAX_CODE_RETRIES - 1
        )
          continue;
        throw err;
      }
    }
    throw new Error('Failed to generate a unique shipment code');
  }

  private static async _buildOutLines(
    shipment: ShipmentModel
  ): Promise<TStockLine[]> {
    if (!shipment.salesTransactionId)
      throw new Error(
        'Shipment must be linked to a sales transaction with line items before delivery'
      );
    const lineItems = await SalesLineItemModel.findAll({
      where: { salesTransactionId: shipment.salesTransactionId }
    });
    if (lineItems.length === 0)
      throw new Error(
        'Linked sales transaction has no line items; cannot deduct inventory'
      );
    return lineItems.map((li) => ({
      productType:
        li.productType === PRODUCT_TYPE.MEAT
          ? PRODUCT_TYPE.MEAT
          : PRODUCT_TYPE.BYPRODUCT,
      animalType: li.animalType,
      byproductType: li.byproductType,
      quantityKg: Number(li.quantityKg)
    }));
  }

  static async updateStatus(
    id: string,
    status: SHIPMENT_STATUS
  ): Promise<ShipmentModel> {
    const shipment = await this.findIdCheck(id);
    if (FORWARD[shipment.status] !== status) {
      throw new Error(
        `Invalid status transition from ${shipment.status} to ${status}`
      );
    }

    if (status === SHIPMENT_STATUS.DELIVERED) {
      const lines = await this._buildOutLines(shipment);
      await sequelize.transaction(async (t) => {
        await InventoryController.applyShipmentOut(
          { shipmentId: shipment.id, lines },
          t
        );
        await shipment.update(
          { status, shippedAt: new Date() },
          { transaction: t }
        );
      });
      return shipment;
    }

    await shipment.update({ status });
    return shipment;
  }

  static async list(
    doc: TGetShipments
  ): Promise<TPaginationGeneric<TShipment>> {
    const where: WhereOptions = {};
    if (doc.status) Object.assign(where, { status: doc.status });
    if (doc.customerId) Object.assign(where, { customerId: doc.customerId });
    if (doc.salesTransactionId)
      Object.assign(where, { salesTransactionId: doc.salesTransactionId });
    if (doc.dateRange?.startDate || doc.dateRange?.endDate) {
      const range: Record<symbol, Date> = {};
      if (doc.dateRange.startDate)
        range[Op.gte] = new Date(doc.dateRange.startDate);
      if (doc.dateRange.endDate)
        range[Op.lte] = new Date(doc.dateRange.endDate);
      Object.assign(where, { createdAt: range });
    }

    return listPaginated(ShipmentModel, doc, {
      where,
      include: [
        { model: CustomerModel, as: 'customer' },
        { model: SalesTransactionModel, as: 'salesTransaction' }
      ],
      order: [['createdAt', 'DESC']],
      distinct: true
    });
  }

  static getById(id: string): Promise<ShipmentModel> {
    return findOrThrow(ShipmentModel, id, 'Shipment not found', {
      include: [
        { model: CustomerModel, as: 'customer' },
        { model: SalesTransactionModel, as: 'salesTransaction' },
        { model: FileModel, as: 'photo' },
        {
          model: ShipmentCargoEntryModel,
          as: 'cargoEntries',
          include: [{ model: AdminModel, as: 'createdBy' }]
        },
        {
          model: ShipmentPhotoModel,
          as: 'photos',
          include: [{ model: FileModel, as: 'file' }]
        }
      ]
    });
  }

  // Loading info: driver name/phone, serial number, vehicle plate. Allowed at
  // any status — the storekeeper fills these in as the truck arrives.
  static async updateLoadingInfo(
    id: string,
    args: {
      vehiclePlate?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      serialNumber?: string | null;
    }
  ): Promise<ShipmentModel> {
    const s = await this.findIdCheck(id);
    if (args.vehiclePlate !== undefined)
      s.vehiclePlate = args.vehiclePlate?.trim() || null;
    if (args.driverName !== undefined)
      s.driverName = args.driverName?.trim() || null;
    if (args.driverPhone !== undefined)
      s.driverPhone = args.driverPhone?.trim() || null;
    if (args.serialNumber !== undefined)
      s.serialNumber = args.serialNumber?.trim() || null;
    await s.save();
    return s;
  }

  // Multi-photo manifest. fileId references an already-uploaded File row
  // (created via the existing /file/upload route with type='shipment').
  static async addPhoto(
    shipmentId: string,
    fileId: string
  ): Promise<ShipmentPhotoModel> {
    await this.findIdCheck(shipmentId);
    await FileController.findIdCheck(fileId);
    return await sequelize.transaction(async (t) => {
      const maxSeq: number =
        ((await ShipmentPhotoModel.max('sequenceNo', {
          where: { shipmentId },
          transaction: t
        })) as number | null) ?? 0;
      return await ShipmentPhotoModel.create(
        { shipmentId, fileId, sequenceNo: maxSeq + 1 },
        { transaction: t }
      );
    });
  }

  static async removePhoto(id: string): Promise<void> {
    const row = await findOrThrow(ShipmentPhotoModel, id, 'Зураг олдсонгүй');
    await row.destroy();
  }

  // ─── Cargo manifest (per-load weights) ────────────────────────────
  //
  // A cargo entry is one boxed/weighed load on the shipment. The storekeeper
  // appends one row per scale read while loading the truck; the FE groups
  // by `productLabel` to compute per-product subtotals + overall total.
  //
  // Locking rule mirrors weighing entries: PENDING / LOADED can be edited;
  // once DELIVERED the manifest is frozen.

  private static _assertCargoEditable(shipment: ShipmentModel): void {
    if (shipment.status === SHIPMENT_STATUS.DELIVERED)
      throw new Error('Ачилт хүргэгдсэн тул өөрчлөх боломжгүй');
  }

  private static async _resyncWeight(
    shipmentId: string
  ): Promise<number> {
    const rows = await ShipmentCargoEntryModel.findAll({
      where: { shipmentId }
    });
    const total = rows.reduce((s, r) => s + Number(r.weightKg), 0);
    const next = Number(total.toFixed(2));
    await ShipmentModel.update(
      { weightKg: next },
      { where: { id: shipmentId } }
    );
    return next;
  }

  static async addCargoEntry(
    shipmentId: string,
    args: {
      productLabel: string;
      pieceCount?: number | null;
      grossKg?: number | null;
      tareKg?: number | null;
      // Direct net weight; ignored when grossKg+tareKg both provided.
      weightKg?: number | null;
      // Buyer-side price at loading. Nullable for "load now, price later".
      pricePerKg?: number | null;
    },
    context: TContext
  ): Promise<ShipmentCargoEntryModel> {
    const shipment = await this.findIdCheck(shipmentId);
    this._assertCargoEditable(shipment);
    const label = (args.productLabel ?? '').trim();
    if (!label) throw new Error('Барааны нэр шаардлагатай');

    // Net weight derivation: prefer gross-minus-tare (the storekeeper's
    // notebook math); fall back to the directly-supplied net.
    const gross =
      args.grossKg != null && Number.isFinite(Number(args.grossKg))
        ? Number(args.grossKg)
        : null;
    const tare =
      args.tareKg != null && Number.isFinite(Number(args.tareKg))
        ? Number(args.tareKg)
        : null;
    let net: number | null;
    if (gross != null && tare != null) {
      if (gross <= 0) throw new Error('Бохир жин эерэг тоо');
      if (tare < 0) throw new Error('Тара жин сөрөг байж болохгүй');
      if (tare >= gross)
        throw new Error('Тара жин нь бохир жингээс бага байх ёстой');
      net = Number((gross - tare).toFixed(2));
    } else if (args.weightKg != null) {
      const w = Number(args.weightKg);
      if (!Number.isFinite(w) || w <= 0)
        throw new Error('Цэвэр жин эерэг тоо');
      net = Number(w.toFixed(2));
    } else {
      throw new Error('Жин оруулаагүй байна (бохир/тара эсвэл цэвэр)');
    }

    const pieces =
      args.pieceCount != null && Number.isFinite(Number(args.pieceCount))
        ? Math.max(0, Math.floor(Number(args.pieceCount)))
        : null;

    let price: number | null = null;
    if (args.pricePerKg != null) {
      const p = Number(args.pricePerKg);
      if (!Number.isFinite(p) || p < 0)
        throw new Error('Үнэ сөрөг байж болохгүй');
      price = Number(p.toFixed(2));
    }

    const entry = await sequelize.transaction(async (t) => {
      const maxSeq: number =
        ((await ShipmentCargoEntryModel.max('sequenceNo', {
          where: { shipmentId },
          transaction: t
        })) as number | null) ?? 0;
      const row = await ShipmentCargoEntryModel.create(
        {
          shipmentId,
          productLabel: label,
          pieceCount: pieces,
          grossKg: gross,
          tareKg: tare,
          weightKg: net,
          pricePerKg: price,
          sequenceNo: maxSeq + 1,
          createdById: context.id
        },
        { transaction: t }
      );
      return row;
    });

    await this._resyncWeight(shipmentId);
    return entry;
  }

  // Late price update — the "load now, price later" path used when the buyer
  // hasn't agreed a price by the time the truck is loaded. Allowed while the
  // shipment is still editable (PENDING / LOADED).
  static async updateCargoEntryPrice(
    id: string,
    pricePerKg: number | null
  ): Promise<ShipmentCargoEntryModel> {
    const entry = await findOrThrow(
      ShipmentCargoEntryModel,
      id,
      'Ачилтын мөр олдсонгүй'
    );
    const shipment = await this.findIdCheck(entry.shipmentId);
    this._assertCargoEditable(shipment);
    if (pricePerKg == null) {
      entry.pricePerKg = null;
    } else {
      const p = Number(pricePerKg);
      if (!Number.isFinite(p) || p < 0)
        throw new Error('Үнэ сөрөг байж болохгүй');
      entry.pricePerKg = Number(p.toFixed(2));
    }
    await entry.save();
    return entry;
  }

  static async deleteCargoEntry(
    id: string,
    _context: TContext
  ): Promise<void> {
    const entry = await findOrThrow(
      ShipmentCargoEntryModel,
      id,
      'Ачилтын мөр олдсонгүй'
    );
    const shipment = await this.findIdCheck(entry.shipmentId);
    this._assertCargoEditable(shipment);
    const { shipmentId } = entry;
    await entry.destroy();
    await this._resyncWeight(shipmentId);
  }
}
