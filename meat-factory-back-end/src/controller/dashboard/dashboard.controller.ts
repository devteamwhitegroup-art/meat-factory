import { fn, col, Op, WhereOptions } from "sequelize";
import { SalesTransactionModel } from "../../models/sales/sales-transaction.model";
import { SalesLineItemModel } from "../../models/sales/sales-line-item.model";
import { ShipmentModel } from "../../models/shipment/shipment.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { ByproductLogModel } from "../../models/livestock/byproduct-log.model";
import { CustomerModel } from "../../models/customer/customer.model";
import {
  PAYMENT_STATUS,
  PRODUCT_TYPE,
} from "../../types/sales/sales-transaction.type";
import { REGISTRATION_STATUS } from "../../types/livestock/registration.type";
import {
  TDashboard,
  TDateRange,
  TGetDashboard,
  TPipelineCounts,
} from "../../types/dashboard/dashboard.type";

export class DashboardController {
  private static _dateWhere(
    range: TDateRange | undefined,
    column: string,
  ): WhereOptions {
    if (!range || (!range.startDate && !range.endDate)) return {};
    const r: Record<symbol, Date> = {};
    if (range.startDate) r[Op.gte] = new Date(range.startDate);
    if (range.endDate) r[Op.lte] = new Date(range.endDate);
    return { [column]: r };
  }

  // ── Sales-side ──────────────────────────────────────────────────────

  private static async _totalMeatIncome(dr?: TDateRange): Promise<number> {
    const row = (await SalesLineItemModel.findOne({
      attributes: [[fn("SUM", col("line_amount")), "total"]],
      where: { productType: PRODUCT_TYPE.MEAT },
      include: [
        {
          model: SalesTransactionModel,
          as: "salesTransaction",
          attributes: [],
          where: this._dateWhere(dr, "transactionDate"),
          required: true,
        },
      ],
      raw: true,
    })) as unknown as { total: string | null } | null;
    return Number(row?.total ?? 0);
  }

  private static async _transactionCount(dr?: TDateRange): Promise<number> {
    return await SalesTransactionModel.count({
      where: this._dateWhere(dr, "transactionDate"),
    });
  }

  private static async _pendingServicesCount(): Promise<number> {
    return await SalesTransactionModel.count({
      where: { paymentStatus: PAYMENT_STATUS.PENDING },
    });
  }

  private static async _animalBreakdown(dr?: TDateRange) {
    const rows = (await SalesLineItemModel.findAll({
      attributes: [
        "animalType",
        [fn("SUM", col("quantity_kg")), "totalKg"],
        [fn("SUM", col("line_amount")), "totalAmount"],
      ],
      where: { productType: PRODUCT_TYPE.MEAT },
      include: [
        {
          model: SalesTransactionModel,
          as: "salesTransaction",
          attributes: [],
          where: this._dateWhere(dr, "transactionDate"),
          required: true,
        },
      ],
      group: ["animal_type"],
      raw: true,
    })) as unknown as Array<{
      animalType: string;
      totalKg: string;
      totalAmount: string;
    }>;
    return rows.map((r) => ({
      animalType: r.animalType,
      totalKg: Number(r.totalKg ?? 0),
      totalAmount: Number(r.totalAmount ?? 0),
    }));
  }

  // ── Livestock-side (herder economics) ───────────────────────────────

  // Sum of paid settlements (money actually given to herders).
  private static async _totalHerderIncome(dr?: TDateRange): Promise<number> {
    const row = (await SettlementModel.findOne({
      attributes: [[fn("SUM", col("net_payable")), "total"]],
      where: { isPaid: true, ...this._dateWhere(dr, "paidAt") },
      raw: true,
    })) as unknown as { total: string | null } | null;
    return Number(row?.total ?? 0);
  }

  // Sum of created-but-unpaid settlements — the floor of cash owed to herders.
  // Filtered by createdAt so it can be scoped to a period.
  private static async _pendingPayoutAmount(dr?: TDateRange): Promise<number> {
    const row = (await SettlementModel.findOne({
      attributes: [[fn("SUM", col("net_payable")), "total"]],
      where: { isPaid: false, ...this._dateWhere(dr, "createdAt") },
      raw: true,
    })) as unknown as { total: string | null } | null;
    return Number(row?.total ?? 0);
  }

  // Distinct herders with at least one NON-cancelled registration. Drops the
  // pre-refactor behaviour of counting cancelled rows.
  private static async _activeHerderCount(): Promise<number> {
    const ids = (await RegistrationModel.findAll({
      attributes: [[fn("DISTINCT", col("herder_id")), "herderId"]],
      where: { status: { [Op.ne]: REGISTRATION_STATUS.CANCELLED } },
      raw: true,
    })) as unknown as Array<{ herderId: string }>;
    return ids.length;
  }

  // ── Byproduct (handoff, not sales) ──────────────────────────────────

  // Total byproduct kg = handoff weight from ByproductLog rows in period.
  // The old "sales" source returned 0 since factory doesn't sell byproducts.
  private static async _totalByproductKg(dr?: TDateRange): Promise<number> {
    const row = (await ByproductLogModel.findOne({
      attributes: [[fn("SUM", col("total_weight_kg")), "total"]],
      where: { ...this._dateWhere(dr, "createdAt") },
      raw: true,
    })) as unknown as { total: string | null } | null;
    return Number(row?.total ?? 0);
  }

  // Top byproducts by handoff weight, grouped by free-form name. Returns the
  // top 12 — the long tail isn't useful in a pie.
  private static async _byproductBreakdown(dr?: TDateRange) {
    const rows = (await ByproductLogModel.findAll({
      attributes: ["name", [fn("SUM", col("total_weight_kg")), "totalKg"]],
      where: { ...this._dateWhere(dr, "createdAt"), name: { [Op.ne]: null } },
      group: ["name"],
      order: [[fn("SUM", col("total_weight_kg")), "DESC"]],
      limit: 12,
      raw: true,
    })) as unknown as Array<{ name: string; totalKg: string }>;
    return rows.map((r) => ({
      name: r.name,
      totalKg: Number(r.totalKg ?? 0),
    }));
  }

  // ── Pipeline stage counts (mirrors the FE /registrations chips) ─────

  private static async _pipelineCounts(): Promise<TPipelineCounts> {
    const groups = (await RegistrationModel.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "n"]],
      group: ["status"],
      raw: true,
    })) as unknown as Array<{ status: string; n: string }>;
    const out: TPipelineCounts = {
      registered: 0,
      inProcess: 0,
      paymentPending: 0,
      paid: 0,
    };
    for (const g of groups) {
      const n = Number(g.n ?? 0);
      switch (g.status) {
        case REGISTRATION_STATUS.REGISTERED:
          out.registered += n;
          break;
        case REGISTRATION_STATUS.WEIGHED:
        case REGISTRATION_STATUS.VERIFIED:
          out.inProcess += n;
          break;
        case REGISTRATION_STATUS.PAYMENT_PENDING:
          out.paymentPending += n;
          break;
        case REGISTRATION_STATUS.SETTLED:
          out.paid += n;
          break;
        // CANCELLED intentionally not exposed in the pipeline tile.
      }
    }
    return out;
  }

  // ── Recent activity ─────────────────────────────────────────────────

  private static async _recentTransactions() {
    return await SalesTransactionModel.findAll({
      include: [{ model: CustomerModel, as: "customer" }],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });
  }

  private static async _recentShipments() {
    return await ShipmentModel.findAll({
      include: [{ model: CustomerModel, as: "customer" }],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });
  }

  static async getDashboard(doc: TGetDashboard): Promise<TDashboard> {
    const dr = doc?.dateRange;
    const [
      totalMeatIncome,
      totalByproductKg,
      totalHerderIncome,
      pendingPayoutAmount,
      activeHerderCount,
      transactionCount,
      pendingServicesCount,
      animalBreakdown,
      byproductBreakdown,
      pipeline,
      recentTransactions,
      recentShipments,
    ] = await Promise.all([
      this._totalMeatIncome(dr),
      this._totalByproductKg(dr),
      this._totalHerderIncome(dr),
      this._pendingPayoutAmount(dr),
      this._activeHerderCount(),
      this._transactionCount(dr),
      this._pendingServicesCount(),
      this._animalBreakdown(dr),
      this._byproductBreakdown(dr),
      this._pipelineCounts(),
      this._recentTransactions(),
      this._recentShipments(),
    ]);

    return {
      totalMeatIncome,
      totalHerderIncome,
      pendingPayoutAmount,
      activeHerderCount,
      transactionCount,
      pendingServicesCount,
      totalByproductKg,
      animalBreakdown,
      byproductBreakdown,
      pipeline,
      recentTransactions,
      recentShipments,
    };
  }
}
