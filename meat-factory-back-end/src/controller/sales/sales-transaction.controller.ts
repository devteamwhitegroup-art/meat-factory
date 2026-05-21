import {
  Op,
  UniqueConstraintError,
  WhereOptions
} from 'sequelize';
import sequelize from '../../config/db-connection';
import { SalesTransactionModel } from '../../models/sales/sales-transaction.model';
import { SalesLineItemModel } from '../../models/sales/sales-line-item.model';
import { CustomerModel } from '../../models/customer/customer.model';
import { ShipmentModel } from '../../models/shipment/shipment.model';
import {
  PAYMENT_STATUS,
  PRODUCT_TYPE,
  TCreateSalesTransaction,
  TGetSalesTransactions,
  TSalesTransaction
} from '../../types/sales/sales-transaction.type';
import { TContext, TPaginationGeneric } from '../../types/global/global.type';
import { CustomerController } from '../customer/customer.controller';
import { pagination } from '../../utils';

const MAX_CODE_RETRIES = 5;

export class SalesTransactionController {
  static async findIdCheck(id: string): Promise<SalesTransactionModel> {
    const tx = await SalesTransactionModel.findByPk(id);
    if (!tx) throw new Error('Sales transaction not found');
    return tx;
  }

  private static _rand4(): number {
    return Math.floor(1000 + Math.random() * 9000);
  }

  private static _generateCode(): string {
    return `${this._rand4()}-${this._rand4()}`;
  }

  static async create(
    doc: TCreateSalesTransaction,
    context: TContext
  ): Promise<SalesTransactionModel> {
    await CustomerController.findIdCheck(doc.customerId);

    let totalWeightKg = 0;
    let amount = doc.amount ?? 0;
    const lineRows: Array<{
      productType: PRODUCT_TYPE;
      animalType: string | null;
      byproductType: string | null;
      quantityKg: number;
      unitPrice: number;
      lineAmount: number;
    }> = [];

    if (doc.lineItems && doc.lineItems.length > 0) {
      for (const li of doc.lineItems) {
        if (!li.quantityKg || li.quantityKg <= 0)
          throw new Error('Line quantity must be a positive number');
        if (li.unitPrice == null || li.unitPrice < 0)
          throw new Error('Line unit price must be >= 0');
        if (li.productType === PRODUCT_TYPE.MEAT) {
          if (!li.animalType)
            throw new Error('MEAT line requires animalType');
          if (li.byproductType)
            throw new Error('MEAT line cannot have byproductType');
        } else {
          if (!li.byproductType)
            throw new Error('BYPRODUCT line requires byproductType');
          if (li.animalType)
            throw new Error('BYPRODUCT line cannot have animalType');
        }
        const lineAmount = Number(
          (li.quantityKg * li.unitPrice).toFixed(2)
        );
        totalWeightKg += li.quantityKg;
        lineRows.push({
          productType: li.productType,
          animalType: li.animalType ?? null,
          byproductType: li.byproductType ?? null,
          quantityKg: li.quantityKg,
          unitPrice: li.unitPrice,
          lineAmount
        });
      }
      amount = Number(
        lineRows.reduce((a, r) => a + r.lineAmount, 0).toFixed(2)
      );
    } else {
      if (!amount || amount <= 0)
        throw new Error(
          'amount must be a positive number when no line items are given'
        );
    }

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      try {
        return await sequelize.transaction(async (t) => {
          const tx = await SalesTransactionModel.create(
            {
              transactionCode: this._generateCode(),
              customerId: doc.customerId,
              totalWeightKg: Number(totalWeightKg.toFixed(2)),
              amount,
              paymentStatus: PAYMENT_STATUS.PENDING,
              transactionDate: doc.transactionDate ?? new Date(),
              createdById: context.id,
              notes: doc.notes ?? null
            },
            { transaction: t }
          );

          if (lineRows.length > 0) {
            await SalesLineItemModel.bulkCreate(
              lineRows.map((r) => ({
                ...r,
                salesTransactionId: tx.id
              })),
              { transaction: t }
            );
          }
          return tx;
        });
      } catch (err) {
        if (
          err instanceof UniqueConstraintError &&
          attempt < MAX_CODE_RETRIES - 1
        ) {
          continue; // collided on transactionCode — retry
        }
        throw err;
      }
    }
    throw new Error('Failed to generate a unique transaction code');
  }

  static async markPaid(id: string): Promise<SalesTransactionModel> {
    const tx = await this.findIdCheck(id);
    if (tx.paymentStatus === PAYMENT_STATUS.PAID)
      throw new Error('Transaction already paid');
    await tx.update({
      paymentStatus: PAYMENT_STATUS.PAID,
      paidAt: new Date()
    });
    return tx;
  }

  static async list(
    doc: TGetSalesTransactions
  ): Promise<TPaginationGeneric<TSalesTransaction>> {
    const { offset, limit } = pagination(doc);
    const where: WhereOptions = {};
    if (doc.paymentStatus)
      Object.assign(where, { paymentStatus: doc.paymentStatus });
    if (doc.customerId) Object.assign(where, { customerId: doc.customerId });
    if (doc.dateRange?.startDate || doc.dateRange?.endDate) {
      const range: Record<symbol, Date> = {};
      if (doc.dateRange.startDate)
        range[Op.gte] = new Date(doc.dateRange.startDate);
      if (doc.dateRange.endDate)
        range[Op.lte] = new Date(doc.dateRange.endDate);
      Object.assign(where, { transactionDate: range });
    }

    return await SalesTransactionModel.findAndCountAll({
      where,
      include: [{ model: CustomerModel, as: 'customer' }],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
  }

  static async getById(id: string): Promise<SalesTransactionModel> {
    const tx = await SalesTransactionModel.findByPk(id, {
      include: [
        { model: CustomerModel, as: 'customer' },
        { model: SalesLineItemModel, as: 'lineItems' },
        { model: ShipmentModel, as: 'shipment' }
      ]
    });
    if (!tx) throw new Error('Sales transaction not found');
    return tx;
  }
}
