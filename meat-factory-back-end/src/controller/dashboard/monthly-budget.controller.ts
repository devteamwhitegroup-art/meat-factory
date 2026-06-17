import { fn, col, Op } from 'sequelize';
import { MonthlyBudgetModel } from '../../models/dashboard/monthly-budget.model';
import { SalesTransactionModel } from '../../models/sales/sales-transaction.model';
import { SettlementModel } from '../../models/livestock/settlement.model';
import {
  TMonthlyBudget,
  TMonthlyOverviewRow,
  TUpsertMonthlyBudget
} from '../../types/dashboard/monthly-budget.type';
import {
  PAYMENT_STATUS
} from '../../types/sales/sales-transaction.type';

const MAX_MONTHS_BACK = 36;

// MonthlyBudgetController owns the budget table (admin sets target per month)
// AND the dashboard monthly-overview aggregation (budget vs herder cost vs
// income). Bundled here so the chart's data shape stays close to where the
// budget rows live.
export class MonthlyBudgetController {
  static async list(): Promise<TMonthlyBudget[]> {
    return await MonthlyBudgetModel.findAll({
      order: [
        ['year', 'DESC'],
        ['month', 'DESC']
      ]
    });
  }

  // Single row per (year, month). Pre-existing rows update; new rows insert.
  static async upsert(doc: TUpsertMonthlyBudget): Promise<MonthlyBudgetModel> {
    const year = Number(doc.year);
    const month = Number(doc.month);
    if (!Number.isFinite(year) || year < 2000 || year > 2200)
      throw new Error('Жил буруу байна');
    if (!Number.isFinite(month) || month < 1 || month > 12)
      throw new Error('Сар 1-12 хооронд байх ёстой');
    const amount = Number(doc.amountMnt);
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error('Дүн сөрөг байж болохгүй');

    const existing = await MonthlyBudgetModel.findOne({
      where: { year, month }
    });
    if (existing) {
      existing.amountMnt = amount;
      existing.notes = doc.notes ?? null;
      await existing.save();
      return existing;
    }
    return await MonthlyBudgetModel.create({
      year,
      month,
      amountMnt: amount,
      notes: doc.notes ?? null
    });
  }

  static async remove(id: string): Promise<void> {
    const row = await MonthlyBudgetModel.findByPk(id);
    if (!row) throw new Error('Төсөв олдсонгүй');
    await row.destroy();
  }

  // Returns one row per month for the last `monthsBack` months including the
  // current month. Missing budget rows → 0. Income = paid sales transactions
  // (transactionDate fallback to createdAt); herder cost = paid settlements
  // (paidAt or createdAt).
  static async overview(monthsBack: number): Promise<TMonthlyOverviewRow[]> {
    const n = Math.max(1, Math.min(MAX_MONTHS_BACK, Math.floor(monthsBack)));
    // Anchor the range to a stable "today" — Date.now() is forbidden inside
    // workflows but this is a regular controller, so plain new Date() is OK.
    const now = new Date();
    const windowStart = new Date(
      now.getFullYear(),
      now.getMonth() - (n - 1),
      1
    );

    const budgets = await MonthlyBudgetModel.findAll({
      where: {
        [Op.or]: Array.from({ length: n }).map((_, i) => {
          const d = new Date(
            windowStart.getFullYear(),
            windowStart.getMonth() + i,
            1
          );
          return { year: d.getFullYear(), month: d.getMonth() + 1 };
        })
      }
    });
    const budgetMap = new Map<string, number>();
    for (const b of budgets)
      budgetMap.set(`${b.year}-${b.month}`, Number(b.amountMnt));

    // Income — sum of PAID sales transactions by month.
    const incomeRows = (await SalesTransactionModel.findAll({
      attributes: [
        [fn('date_trunc', 'month', col('transaction_date')), 'bucket'],
        [fn('SUM', col('amount')), 'total']
      ],
      where: {
        paymentStatus: PAYMENT_STATUS.PAID,
        transactionDate: { [Op.gte]: windowStart }
      },
      group: ['bucket'],
      raw: true
    })) as unknown as { bucket: string | Date; total: string | null }[];
    const incomeMap = new Map<string, number>();
    for (const r of incomeRows) {
      const d = new Date(r.bucket);
      incomeMap.set(
        `${d.getFullYear()}-${d.getMonth() + 1}`,
        Number(r.total ?? 0)
      );
    }

    // Herder cost — sum of net payable on PAID settlements (paidAt is set)
    // bucketed by paidAt month.
    const settlementRows = (await SettlementModel.findAll({
      attributes: [
        [fn('date_trunc', 'month', col('paid_at')), 'bucket'],
        [fn('SUM', col('net_payable')), 'total']
      ],
      where: {
        paidAt: { [Op.gte]: windowStart }
      },
      group: ['bucket'],
      raw: true
    })) as unknown as { bucket: string | Date; total: string | null }[];
    const costMap = new Map<string, number>();
    for (const r of settlementRows) {
      const d = new Date(r.bucket);
      costMap.set(
        `${d.getFullYear()}-${d.getMonth() + 1}`,
        Number(r.total ?? 0)
      );
    }

    const out: TMonthlyOverviewRow[] = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(
        windowStart.getFullYear(),
        windowStart.getMonth() + i,
        1
      );
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      out.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        budgetMnt: budgetMap.get(key) ?? 0,
        herderCostMnt: costMap.get(key) ?? 0,
        incomeMnt: incomeMap.get(key) ?? 0
      });
    }
    return out;
  }
}
