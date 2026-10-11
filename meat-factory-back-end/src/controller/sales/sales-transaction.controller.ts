import { Transaction, UniqueConstraintError, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { SalesTransactionModel } from "../../models/sales/sales-transaction.model";
import { SalesLineItemModel } from "../../models/sales/sales-line-item.model";
import { SalesInstallmentModel } from "../../models/sales/sales-installment.model";
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
import { CustomerController } from "../customer/customer.controller";
import { dateRangeWhere, findOrThrow, listPaginated } from "../../utils";

const MAX_CODE_RETRIES = 5;

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

    let totalWeightKg = 0;
    let amount = doc.amount ?? 0;
    const lineRows: Array<{
      productType: PRODUCT_TYPE;
      animalType: string | null;
      byproductName: string | null;
      quantityKg: number;
      unitPrice: number;
      lineAmount: number;
    }> = [];

    if (doc.lineItems && doc.lineItems.length > 0) {
      for (const li of doc.lineItems) {
        if (!li.quantityKg || li.quantityKg <= 0)
          throw new Error("Line quantity must be a positive number");
        if (li.unitPrice == null || li.unitPrice < 0)
          throw new Error("Line unit price must be >= 0");
        if (li.productType === PRODUCT_TYPE.MEAT) {
          if (!li.animalType) throw new Error("MEAT line requires animalType");
          if (li.byproductName)
            throw new Error("MEAT line cannot have byproductName");
        } else {
          if (!li.byproductName?.trim())
            throw new Error("BYPRODUCT line requires byproductName");
          if (li.animalType)
            throw new Error("BYPRODUCT line cannot have animalType");
        }
        const lineAmount = Number((li.quantityKg * li.unitPrice).toFixed(2));
        totalWeightKg += li.quantityKg;
        lineRows.push({
          productType: li.productType,
          animalType: li.animalType ?? null,
          byproductName: li.byproductName?.trim() || null,
          quantityKg: li.quantityKg,
          unitPrice: li.unitPrice,
          lineAmount,
        });
      }
      amount = Number(
        lineRows.reduce((a, r) => a + r.lineAmount, 0).toFixed(2),
      );
    } else {
      if (!amount || amount <= 0)
        throw new Error(
          "amount must be a positive number when no line items are given",
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
              notes: doc.notes ?? null,
            },
            { transaction: t },
          );

          if (lineRows.length > 0) {
            await SalesLineItemModel.bulkCreate(
              lineRows.map((r) => ({
                ...r,
                salesTransactionId: tx.id,
              })),
              { transaction: t },
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
    throw new Error("Failed to generate a unique transaction code");
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
    if (!shipment.customerId) return null; // no customer to bill — skip

    const existing = await SalesTransactionModel.findOne({
      where: { shipmentId: shipment.id },
      transaction: t,
    });
    if (existing) return existing; // idempotent

    const lineRows = await this._shipmentRows(shipment.id, t);
    if (lineRows.length === 0) return null; // nothing to invoice
    const { totalWeightKg, amount } = this._totals(lineRows);

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      try {
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
          { transaction: t },
        );
        await SalesLineItemModel.bulkCreate(
          lineRows.map((r) => ({ ...r, salesTransactionId: tx.id })),
          { transaction: t },
        );
        return tx;
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
    throw new Error("Failed to generate a unique transaction code");
  }

  // Invoice rows for a shipment: one per product group. Reported groups bill
  // the sold kg at the sales report's amount (unit price = its average);
  // unreported ones bill the loaded kg with no price yet.
  private static async _shipmentRows(shipmentId: string, t?: Transaction) {
    const groups = await ShipmentSaleLineModel.findAll({
      where: { shipmentId },
      include: [{ model: ShipmentSaleEntryModel, as: "entries" }],
      transaction: t,
    });
    return groups.map((g) => {
      const entries = g.entries ?? [];
      const sold = entries.reduce((s, e) => s + Number(e.weightKg), 0);
      const total = entries.reduce(
        (s, e) => s + Number(e.weightKg) * Number(e.pricePerKg),
        0,
      );
      const reported = entries.length > 0;
      return {
        productType: g.productType,
        animalType: g.animalType,
        byproductName: g.byproductName,
        quantityKg: Number(
          (reported ? sold : Number(g.totalWeightKg)).toFixed(2),
        ),
        unitPrice: reported ? Number((total / sold).toFixed(2)) : null,
        lineAmount: reported ? Number(total.toFixed(2)) : null,
      };
    });
  }

  private static _totals(
    rows: { quantityKg: number; lineAmount: number | null }[],
  ) {
    const allPriced = rows.every((r) => r.lineAmount != null);
    return {
      totalWeightKg: Number(
        rows.reduce((s, r) => s + r.quantityKg, 0).toFixed(2),
      ),
      amount: allPriced
        ? Number(rows.reduce((s, r) => s + (r.lineAmount ?? 0), 0).toFixed(2))
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

  // Recompute the parent transaction's amount from its line items — null
  // until every line has a price. Mirrors ShipmentController._recomputeTotal.
  private static async _recomputeAmount(
    salesTransactionId: string,
  ): Promise<void> {
    const lines = await SalesLineItemModel.findAll({
      where: { salesTransactionId },
    });
    const allPriced =
      lines.length > 0 && lines.every((l) => l.unitPrice != null);
    const amount = allPriced
      ? Number(
          lines.reduce((s, l) => s + Number(l.lineAmount ?? 0), 0).toFixed(2),
        )
      : null;
    await SalesTransactionModel.update(
      { amount },
      { where: { id: salesTransactionId } },
    );
  }

  // Fill in (or clear) the per-kg price on one line item — the post-delivery
  // equivalent of ShipmentController.setSalePrice, for lines that came in
  // null from an auto-created invoice.
  static async setLineItemPrice(
    id: string,
    unitPrice: number | null,
  ): Promise<SalesLineItemModel> {
    const line = await findOrThrow(SalesLineItemModel, id, "Мөр олдсонгүй");
    if (unitPrice == null) {
      line.unitPrice = null;
      line.lineAmount = null;
    } else {
      const p = Number(unitPrice);
      if (!Number.isFinite(p) || p < 0)
        throw new Error("Үнэ сөрөг байж болохгүй");
      line.unitPrice = p;
      line.lineAmount = Number((Number(line.quantityKg) * p).toFixed(2));
    }
    await line.save();
    await this._recomputeAmount(line.salesTransactionId);
    return line;
  }

  static async markPaid(id: string): Promise<SalesTransactionModel> {
    const tx = await this.findIdCheck(id);
    if (tx.amount == null)
      throw new Error("Эхлээд гүйлгээний дүнг тохируулна уу");
    if (tx.paymentStatus === PAYMENT_STATUS.PAID)
      throw new Error("Transaction already paid");
    // One-shot full payment only. Once installments are logged the status
    // follows them — the remainder is logged as another installment.
    const logged =
      ((await SalesInstallmentModel.sum("amountMnt", {
        where: { salesTransactionId: id },
      })) as number | null) ?? 0;
    if (logged > 0)
      throw new Error(
        `Үлдэгдэл ${Number(tx.amount) - logged}₮ — төлбөрийг хуваан төлөлтөөр бүртгэнэ үү`,
      );
    await tx.update({
      paymentStatus: PAYMENT_STATUS.PAID,
      paidAt: new Date(),
    });
    return tx;
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
          { model: SalesLineItemModel, as: "lineItems" },
          {
            model: SalesInstallmentModel,
            as: "installments",
            order: [["paidAt", "ASC"]],
          },
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
    t?: import("sequelize").Transaction,
  ): Promise<void> {
    const tx = await SalesTransactionModel.findByPk(txId, { transaction: t });
    if (!tx || tx.amount == null) return;
    const sum =
      ((await SalesInstallmentModel.sum("amountMnt", {
        where: { salesTransactionId: txId },
        transaction: t,
      })) as number | null) ?? 0;
    const total = Number(tx.amount);
    const status =
      sum >= total - 0.01
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
      const sumSoFar =
        ((await SalesInstallmentModel.sum("amountMnt", {
          where: { salesTransactionId: tx.id },
          transaction: t,
        })) as number | null) ?? 0;
      if (sumSoFar + amt > Number(tx.amount) + 0.01)
        throw new Error(
          "Хэсэгчилсэн төлбөрийн нийлбэр гүйлгээний дүнгээс илүү байж болохгүй",
        );
      const row = await SalesInstallmentModel.create(
        {
          salesTransactionId: tx.id,
          amountMnt: Number(amt.toFixed(2)),
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
