import { fn, col, Op, WhereOptions } from 'sequelize';
import { SalesTransactionModel } from '../../models/sales/sales-transaction.model';
import { SalesLineItemModel } from '../../models/sales/sales-line-item.model';
import { ShipmentModel } from '../../models/shipment/shipment.model';
import { SettlementModel } from '../../models/livestock/settlement.model';
import { RegistrationModel } from '../../models/livestock/registration.model';
import { CustomerModel } from '../../models/customer/customer.model';
import { PAYMENT_STATUS, PRODUCT_TYPE } from '../../types/sales/sales-transaction.type';
import {
  TDashboard,
  TDateRange,
  TGetDashboard
} from '../../types/dashboard/dashboard.type';

export class DashboardController {
  private static _dateWhere(
    range: TDateRange | undefined,
    column: string
  ): WhereOptions {
    if (!range || (!range.startDate && !range.endDate)) return {};
    const r: Record<symbol, Date> = {};
    if (range.startDate) r[Op.gte] = new Date(range.startDate);
    if (range.endDate) r[Op.lte] = new Date(range.endDate);
    return { [column]: r };
  }

  private static async _totalMeatIncome(dr?: TDateRange): Promise<number> {
    const row = (await SalesLineItemModel.findOne({
      attributes: [[fn('SUM', col('line_amount')), 'total']],
      where: { productType: PRODUCT_TYPE.MEAT },
      include: [
        {
          model: SalesTransactionModel,
          as: 'salesTransaction',
          attributes: [],
          where: this._dateWhere(dr, 'transactionDate'),
          required: true
        }
      ],
      raw: true
    })) as unknown as { total: string | null } | null;
    return Number(row?.total ?? 0);
  }

  private static async _totalByproductKg(dr?: TDateRange): Promise<number> {
    const row = (await SalesLineItemModel.findOne({
      attributes: [[fn('SUM', col('quantity_kg')), 'total']],
      where: { productType: PRODUCT_TYPE.BYPRODUCT },
      include: [
        {
          model: SalesTransactionModel,
          as: 'salesTransaction',
          attributes: [],
          where: this._dateWhere(dr, 'transactionDate'),
          required: true
        }
      ],
      raw: true
    })) as unknown as { total: string | null } | null;
    return Number(row?.total ?? 0);
  }

  private static async _totalHerderIncome(dr?: TDateRange): Promise<number> {
    const row = (await SettlementModel.findOne({
      attributes: [[fn('SUM', col('net_payable')), 'total']],
      where: { isPaid: true, ...this._dateWhere(dr, 'paidAt') },
      raw: true
    })) as unknown as { total: string | null } | null;
    return Number(row?.total ?? 0);
  }

  private static async _activeHerderCount(): Promise<number> {
    const ids = (await RegistrationModel.findAll({
      attributes: [[fn('DISTINCT', col('herder_id')), 'herderId']],
      raw: true
    })) as unknown as Array<{ herderId: string }>;
    return ids.length;
  }

  private static async _transactionCount(dr?: TDateRange): Promise<number> {
    return await SalesTransactionModel.count({
      where: this._dateWhere(dr, 'transactionDate')
    });
  }

  private static async _pendingServicesCount(): Promise<number> {
    return await SalesTransactionModel.count({
      where: { paymentStatus: PAYMENT_STATUS.PENDING }
    });
  }

  private static async _animalBreakdown(dr?: TDateRange) {
    const rows = (await SalesLineItemModel.findAll({
      attributes: [
        'animalType',
        [fn('SUM', col('quantity_kg')), 'totalKg'],
        [fn('SUM', col('line_amount')), 'totalAmount']
      ],
      where: { productType: PRODUCT_TYPE.MEAT },
      include: [
        {
          model: SalesTransactionModel,
          as: 'salesTransaction',
          attributes: [],
          where: this._dateWhere(dr, 'transactionDate'),
          required: true
        }
      ],
      group: ['animal_type'],
      raw: true
    })) as unknown as Array<{
      animalType: string;
      totalKg: string;
      totalAmount: string;
    }>;
    return rows.map((r) => ({
      animalType: r.animalType,
      totalKg: Number(r.totalKg ?? 0),
      totalAmount: Number(r.totalAmount ?? 0)
    }));
  }

  private static async _byproductBreakdown(dr?: TDateRange) {
    const rows = (await SalesLineItemModel.findAll({
      attributes: [
        'byproductType',
        [fn('SUM', col('quantity_kg')), 'totalKg'],
        [fn('SUM', col('line_amount')), 'totalAmount']
      ],
      where: { productType: PRODUCT_TYPE.BYPRODUCT },
      include: [
        {
          model: SalesTransactionModel,
          as: 'salesTransaction',
          attributes: [],
          where: this._dateWhere(dr, 'transactionDate'),
          required: true
        }
      ],
      group: ['byproduct_type'],
      raw: true
    })) as unknown as Array<{
      byproductType: string;
      totalKg: string;
      totalAmount: string;
    }>;
    return rows.map((r) => ({
      byproductType: r.byproductType,
      totalKg: Number(r.totalKg ?? 0),
      totalAmount: Number(r.totalAmount ?? 0)
    }));
  }

  private static async _recentTransactions() {
    return await SalesTransactionModel.findAll({
      include: [{ model: CustomerModel, as: 'customer' }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
  }

  private static async _recentShipments() {
    return await ShipmentModel.findAll({
      include: [{ model: CustomerModel, as: 'customer' }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
  }

  static async getDashboard(doc: TGetDashboard): Promise<TDashboard> {
    const dr = doc?.dateRange;
    const [
      totalMeatIncome,
      totalByproductKg,
      totalHerderIncome,
      activeHerderCount,
      transactionCount,
      pendingServicesCount,
      animalBreakdown,
      byproductBreakdown,
      recentTransactions,
      recentShipments
    ] = await Promise.all([
      this._totalMeatIncome(dr),
      this._totalByproductKg(dr),
      this._totalHerderIncome(dr),
      this._activeHerderCount(),
      this._transactionCount(dr),
      this._pendingServicesCount(),
      this._animalBreakdown(dr),
      this._byproductBreakdown(dr),
      this._recentTransactions(),
      this._recentShipments()
    ]);

    return {
      totalMeatIncome,
      totalHerderIncome,
      activeHerderCount,
      transactionCount,
      pendingServicesCount,
      totalByproductKg,
      animalBreakdown,
      byproductBreakdown,
      recentTransactions,
      recentShipments
    };
  }
}
