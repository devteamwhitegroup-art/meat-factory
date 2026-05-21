import {
  Op,
  UniqueConstraintError,
  WhereOptions
} from 'sequelize';
import sequelize from '../../config/db-connection';
import { ShipmentModel } from '../../models/shipment/shipment.model';
import { CustomerModel } from '../../models/customer/customer.model';
import { SalesTransactionModel } from '../../models/sales/sales-transaction.model';
import { SalesLineItemModel } from '../../models/sales/sales-line-item.model';
import { FileModel } from '../../models/global/file.model';
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
import { pagination } from '../../utils';

const MAX_CODE_RETRIES = 5;

const FORWARD: Record<SHIPMENT_STATUS, SHIPMENT_STATUS | null> = {
  [SHIPMENT_STATUS.PENDING]: SHIPMENT_STATUS.LOADED,
  [SHIPMENT_STATUS.LOADED]: SHIPMENT_STATUS.DELIVERED,
  [SHIPMENT_STATUS.DELIVERED]: null
};

export class ShipmentController {
  static async findIdCheck(id: string): Promise<ShipmentModel> {
    const s = await ShipmentModel.findByPk(id);
    if (!s) throw new Error('Shipment not found');
    return s;
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
    const { offset, limit } = pagination(doc);
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

    return await ShipmentModel.findAndCountAll({
      where,
      include: [
        { model: CustomerModel, as: 'customer' },
        { model: SalesTransactionModel, as: 'salesTransaction' }
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
  }

  static async getById(id: string): Promise<ShipmentModel> {
    const s = await ShipmentModel.findByPk(id, {
      include: [
        { model: CustomerModel, as: 'customer' },
        { model: SalesTransactionModel, as: 'salesTransaction' },
        { model: FileModel, as: 'photo' }
      ]
    });
    if (!s) throw new Error('Shipment not found');
    return s;
  }
}
