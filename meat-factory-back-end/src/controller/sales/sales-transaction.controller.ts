import { Transaction, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { SalesTransactionModel } from "../../models/sales/sales-transaction.model";
import { SalesLineItemModel } from "../../models/sales/sales-line-item.model";
import { SalesInstallmentModel } from "../../models/sales/sales-installment.model";
import { SalesExpenseModel } from "../../models/sales/sales-expense.model";
import { CustomerModel } from "../../models/customer/customer.model";
import { ShipmentModel } from "../../models/shipment/shipment.model";
import { ShipmentSaleLineModel } from "../../models/shipment/shipment-sale-line.model";
import { ShipmentSaleEntryModel } from "../../models/shipment/shipment-sale-entry.model";
import {
  PAYMENT_STATUS,
  PRODUCT_TYPE,
  TCreateSalesTransaction,
  TGetSalesTransactions,
  TSalesTransaction,
} from "../../types/sales/sales-transaction.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { AnimalModel } from "../../models/livestock/animal.model";
import { CustomerController } from "../customer/customer.controller";
import { AnimalController } from "../livestock/animal.controller";
import { saleTotals } from "../shipment/shipment.controller";
import {
  EPS,
  createWithUniqueCode,
  dateRangeWhere,
  findOrThrow,
  listPaginated,
  round2,
} from "../../utils";

type TLineRow = {
  productType: PRODUCT_TYPE;
  animalId: string | null;
  byproductName: string | null;
  quantityKg: number;
  unitPrice: number | null;
  lineAmount: number | null;
};

export class SalesTransactionController {
  static findIdCheck(id: string): Promise<SalesTransactionModel> {
    return findOrThrow(
      SalesTransactionModel,
      id,
      "Sales transaction not found",
    );
  }

  private static _rand4(): number {
    return Math.floor(1000 + Math.random() * 9000);
  }

  private static _generateCode(): string {
    return `${this._rand4()}-${this._rand4()}`;
  }

  static async create(
    doc: TCreateSalesTransaction,
    context: TContext,
  ): Promise<SalesTransactionModel> {
    await CustomerController.findIdCheck(doc.customerId);

    let amount = doc.amount ?? 0;
    const lines = doc.lineItems ?? [];
    for (const li of lines) {
      if (!li.quantityKg || li.quantityKg <= 0)
        throw new Error("Line quantity must be a positive number");
      if (li.unitPrice == null || li.unitPrice < 0)
        throw new Error("Line unit price must be >= 0");
      if (li.productType === PRODUCT_TYPE.MEAT) {
        if (!li.animalType) throw new Error("MEAT line requires animalType");
        if (li.byproductName)
          throw new Error("MEAT line cannot have byproductName");
      } else if (!li.byproductName?.trim())
        throw new Error("BYPRODUCT line requires byproductName");
    }
    const ids = await AnimalController.mapNamesToIds(
      lines.flatMap((li) => (li.animalType ? [li.animalType] : [])),
    );
    const lineRows: TLineRow[] = lines.map((li) => ({
      productType: li.productType,
      animalId: li.animalType ? ids[li.animalType.trim()] : null,
      byproductName: li.byproductName?.trim() || null,
      quantityKg: li.quantityKg,
      unitPrice: li.unitPrice,
      lineAmount: round2(li.quantityKg * li.unitPrice),
    }));
    if (lineRows.length) amount = this._totals(lineRows).amount ?? 0;
    else if (!amount || amount <= 0)
      throw new Error(
        "amount must be a positive number when no line items are given",
      );

    return createWithUniqueCode(async (_, t) => {
      const tx = await SalesTransactionModel.create(
        {
          transactionCode: this._generateCode(),
          customerId: doc.customerId,
          totalWeightKg: this._totals(lineRows).totalWeightKg,
          amount,
          paymentStatus: PAYMENT_STATUS.PENDING,
          transactionDate: doc.transactionDate ?? new Date(),
          createdById: context.id,
          notes: doc.notes ?? null,
        },
        { transaction: t },
      );
      await SalesLineItemModel.bulkCreate(
        lineRows.map((r) => ({ ...r, salesTransactionId: tx.id })),
        { transaction: t },
      );
      return tx;
    });
  }

  // Called by ShipmentController.updateStatus when a shipment is marked
  // DELIVERED — auto-creates the invoice so admin doesn't have to manually
  // re-enter weight/customer/product breakdown that are already known from
  // the shipment's cargo manifest. One line item per ShipmentSaleLine group,
  // carrying over whatever price (if any) was set pre-delivery; amount stays
  // null until every line is priced (see _recomputeAmount). Runs inside the
  // caller's transaction so it's atomic with the inventory-out + status
  // update.
  static async createFromShipment(
    shipment: ShipmentModel,
    t: Transaction,
  ): Promise<SalesTransactionModel | null> {
    const existing = await SalesTransactionModel.findOne({
      where: { shipmentId: shipment.id },
      transaction: t,
    });
    if (existing) return existing; // idempotent

    const lineRows = await this._shipmentRows(shipment.id, t);
    if (lineRows.length === 0) return null; // nothing to invoice
    const { totalWeightKg, amount } = this._totals(lineRows);

    // Savepoint per attempt: a code collision must not abort the caller's
    // delivery transaction.
    return createWithUniqueCode(async (_, st) => {
      const tx = await SalesTransactionModel.create(
        {
          transactionCode: this._generateCode(),
          customerId: shipment.customerId,
          shipmentId: shipment.id,
          totalWeightKg,
          amount,
          paymentStatus: PAYMENT_STATUS.PENDING,
          transactionDate: new Date(),
          createdById: shipment.loadedById,
          notes: `Ачилт ${shipment.shipmentCode}-с автоматаар үүсгэсэн`,
        },
        { transaction: st },
      );
      await SalesLineItemModel.bulkCreate(
        lineRows.map((r) => ({ ...r, salesTransactionId: tx.id })),
        { transaction: st },
      );
      return tx;
    }, t);
  }

  // Invoice rows for a shipment: one per product group. Reported groups bill
  // the sold kg at the sales report's amount (unit price = its average);
  // unreported ones bill the loaded kg with no price yet.
  private static async _shipmentRows(
    shipmentId: string,
    t?: Transaction,
  ): Promise<TLineRow[]> {
    const groups = await ShipmentSaleLineModel.findAll({
      where: { shipmentId },
      include: [{ model: ShipmentSaleEntryModel, as: "entries" }],
      transaction: t,
    });
    return groups.map((g) => {
      const { soldKg, amount, pricePerKg } = saleTotals(g.entries ?? []);
      return {
        productType: g.productType,
        animalId: g.animalId,
        byproductName: g.byproductName,
        quantityKg: amount == null ? Number(g.totalWeightKg) : soldKg,
        unitPrice: pricePerKg,
        lineAmount: amount,
      };
    });
  }

  // Invoice totals: amount stays null until every line is priced.
  private static _totals(
    rows: { quantityKg: number | string; lineAmount: number | string | null }[],
  ) {
    const allPriced = rows.length > 0 && rows.every((r) => r.lineAmount != null);
    return {
      totalWeightKg: round2(rows.reduce((s, r) => s + Number(r.quantityKg), 0)),
      amount: allPriced
        ? round2(rows.reduce((s, r) => s + Number(r.lineAmount), 0))
        : null,
    };
  }

  // Sales report changed after delivery → rebuild the shipment's invoice
  // lines and amount (payment status re-checked against the new amount).
  static async syncFromShipment(
    shipmentId: string,
    t?: Transaction,
  ): Promise<void> {
    const tx = await SalesTransactionModel.findOne({
      where: { shipmentId },
      transaction: t,
    });
    if (!tx) return; // not delivered yet — created at delivery
    const rows = await this._shipmentRows(shipmentId, t);
    await SalesLineItemModel.destroy({
      where: { salesTransactionId: tx.id },
      transaction: t,
    });
    await SalesLineItemModel.bulkCreate(
      rows.map((r) => ({ ...r, salesTransactionId: tx.id })),
      { transaction: t },
    );
    await tx.update(this._totals(rows), { transaction: t });
    await this._resyncPaymentStatus(tx.id, t);
  }

  // Price a line of a MANUAL invoice by hand. Shipment invoices are priced
  // by the shipment's sales report (syncFromShipment rebuilds their lines),
  // so a hand-set price there would silently vanish — refused.
  static async setLineItemPrice(
    id: string,
    unitPrice: number | null,
  ): Promise<SalesLineItemModel> {
    const line = await findOrThrow(SalesLineItemModel, id, "Мөр олдсонгүй");
    const tx = await this.findIdCheck(line.salesTransactionId);
    if (tx.shipmentId)
      throw new Error(
        "Ачилтын нэхэмжлэлийн үнийг ачилтын борлуулалтын тайлангаас оруулна",
      );
    if (unitPrice == null) {
      line.unitPrice = null;
      line.lineAmount = null;
    } else {
      const p = Number(unitPrice);
      if (!Number.isFinite(p) || p < 0)
        throw new Error("Үнэ сөрөг байж болохгүй");
      line.unitPrice = p;
      line.lineAmount = round2(Number(line.quantityKg) * p);
    }
    return sequelize.transaction(async (t) => {
      await line.save({ transaction: t });
      const lines = await SalesLineItemModel.findAll({
        where: { salesTransactionId: tx.id },
        transaction: t,
      });
      await tx.update(
        { amount: this._totals(lines).amount },
        { transaction: t },
      );
      await this._resyncPaymentStatus(tx.id, t);
      return line;
    });
  }

  // "Paid in full" = log whatever is still outstanding as one installment,
  // so the status keeps following the installments (it used to flip back to
  // PENDING on the next resync because nothing backed the PAID flag).
  static async markPaid(
    id: string,
    context: TContext,
  ): Promise<SalesTransactionModel> {
    const tx = await this.findIdCheck(id);
    if (tx.amount == null)
      throw new Error("Эхлээд гүйлгээний дүнг тохируулна уу");
    if (tx.paymentStatus === PAYMENT_STATUS.PAID)
      throw new Error("Transaction already paid");
    const logged = await this._paidSum(id);
    await this.addInstallment(
      {
        salesTransactionId: id,
        amountMnt: round2(Number(tx.amount) - logged),
        notes: "Бүрэн төлөгдсөн",
      },
      context,
    );
    return tx.reload();
  }

  private static async _paidSum(
    salesTransactionId: string,
    t?: Transaction,
  ): Promise<number> {
    return Number(
      (await SalesInstallmentModel.sum("amountMnt", {
        where: { salesTransactionId },
        transaction: t,
      })) ?? 0,
    );
  }

  static async list(
    doc: TGetSalesTransactions,
  ): Promise<TPaginationGeneric<TSalesTransaction>> {
    const where: WhereOptions = {};
    if (doc.paymentStatus)
      Object.assign(where, { paymentStatus: doc.paymentStatus });
    if (doc.customerId) Object.assign(where, { customerId: doc.customerId });
    Object.assign(where, dateRangeWhere(doc.dateRange, "transactionDate"));

    return listPaginated(SalesTransactionModel, doc, {
      where,
      include: [{ model: CustomerModel, as: "customer" }],
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  static getById(id: string): Promise<SalesTransactionModel> {
    return findOrThrow(
      SalesTransactionModel,
      id,
      "Sales transaction not found",
      {
        include: [
          { model: CustomerModel, as: "customer" },
          { model: ShipmentModel, as: "shipment" },
          {
            model: SalesLineItemModel,
            as: "lineItems",
            include: [{ model: AnimalModel, as: "animal", attributes: ["name"] }],
          },
          {
            model: SalesInstallmentModel,
            as: "installments",
            order: [["paidAt", "ASC"]],
          },
          { model: SalesExpenseModel, as: "expenses" },
        ],
      },
    );
  }

  // ─── Installments ───────────────────────────────────────────────────
  //
  // Each call records one partial payment. When Σ(installments) ≥
  // tx.amount the transaction auto-flips to PAID. Removing installments
  // can also flip a PAID tx back to PENDING when outstanding > 0 again.

  private static async _resyncPaymentStatus(
    txId: string,
    t?: Transaction,
  ): Promise<void> {
    const tx = await SalesTransactionModel.findByPk(txId, { transaction: t });
    if (!tx || tx.amount == null) return;
    const sum = await this._paidSum(txId, t);
    const total = Number(tx.amount);
    const status =
      sum >= total - EPS
        ? PAYMENT_STATUS.PAID
        : sum > 0
          ? PAYMENT_STATUS.PARTIALLY_PAID
          : PAYMENT_STATUS.PENDING;
    if (status === tx.paymentStatus) return;
    let paidAt: Date | null = null;
    if (status === PAYMENT_STATUS.PAID) {
      const latest = await SalesInstallmentModel.findOne({
        where: { salesTransactionId: txId },
        order: [["paidAt", "DESC"]],
        transaction: t,
      });
      paidAt = latest?.paidAt ?? new Date();
    }
    await tx.update({ paymentStatus: status, paidAt }, { transaction: t });
  }

  static async addInstallment(
    args: {
      salesTransactionId: string;
      amountMnt: number;
      paidAt?: Date | null;
      notes?: string | null;
    },
    context: TContext,
  ): Promise<SalesInstallmentModel> {
    const tx = await this.findIdCheck(args.salesTransactionId);
    if (tx.amount == null)
      throw new Error("Эхлээд гүйлгээний дүнг тохируулна уу");
    const amt = Number(args.amountMnt);
    if (!Number.isFinite(amt) || amt <= 0)
      throw new Error("Дүн эерэг тоо байх ёстой");

    return await sequelize.transaction(async (t) => {
      // Lock the invoice: two clerks logging at once can't overpay it.
      await SalesTransactionModel.findByPk(tx.id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const sumSoFar = await this._paidSum(tx.id, t);
      if (sumSoFar + amt > Number(tx.amount) + EPS)
        throw new Error(
          "Хэсэгчилсэн төлбөрийн нийлбэр гүйлгээний дүнгээс илүү байж болохгүй",
        );
      const row = await SalesInstallmentModel.create(
        {
          salesTransactionId: tx.id,
          amountMnt: round2(amt),
          paidAt: args.paidAt ? new Date(args.paidAt) : new Date(),
          notes: args.notes?.trim() || null,
          createdById: context.id,
        },
        { transaction: t },
      );
      await this._resyncPaymentStatus(tx.id, t);
      return row;
    });
  }

  // ─── Other expenses (fuel, parking…) — cost only, the bill is untouched.

  static async addExpense(
    args: {
      salesTransactionId: string;
      name: string;
      amountMnt: number;
      notes?: string | null;
    },
    context: TContext,
  ): Promise<SalesExpenseModel> {
    const tx = await this.findIdCheck(args.salesTransactionId);
    const name = args.name?.trim();
    if (!name) throw new Error("Зардлын нэр оруулна уу");
    const amt = Number(args.amountMnt);
    if (!Number.isFinite(amt) || amt <= 0)
      throw new Error("Дүн эерэг тоо байх ёстой");
    return SalesExpenseModel.create({
      salesTransactionId: tx.id,
      name,
      amountMnt: round2(amt),
      notes: args.notes?.trim() || null,
      createdById: context.id,
    });
  }

  static async removeExpense(id: string): Promise<void> {
    const row = await findOrThrow(SalesExpenseModel, id, "Зардал олдсонгүй");
    await row.destroy();
  }

  static async removeInstallment(id: string): Promise<void> {
    const row = await findOrThrow(
      SalesInstallmentModel,
      id,
      "Хэсэгчилсэн төлбөр олдсонгүй",
    );
    const txId = row.salesTransactionId;
    await sequelize.transaction(async (t) => {
      await row.destroy({ transaction: t });
      await this._resyncPaymentStatus(txId, t);
    });
  }
}
