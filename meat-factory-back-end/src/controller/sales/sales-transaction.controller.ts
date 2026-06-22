import { Op, UniqueConstraintError, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { SalesTransactionModel } from "../../models/sales/sales-transaction.model";
import { SalesLineItemModel } from "../../models/sales/sales-line-item.model";
import { SalesInstallmentModel } from "../../models/sales/sales-installment.model";
import { CustomerModel } from "../../models/customer/customer.model";
import { ShipmentModel } from "../../models/shipment/shipment.model";
import {
  PAYMENT_STATUS,
  PRODUCT_TYPE,
  TCreateSalesTransaction,
  TGetSalesTransactions,
  TSalesTransaction,
} from "../../types/sales/sales-transaction.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { CustomerController } from "../customer/customer.controller";
import { findOrThrow, listPaginated } from "../../utils";

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
      byproductType: string | null;
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
          if (li.byproductType)
            throw new Error("MEAT line cannot have byproductType");
        } else {
          if (!li.byproductType)
            throw new Error("BYPRODUCT line requires byproductType");
          if (li.animalType)
            throw new Error("BYPRODUCT line cannot have animalType");
        }
        const lineAmount = Number((li.quantityKg * li.unitPrice).toFixed(2));
        totalWeightKg += li.quantityKg;
        lineRows.push({
          productType: li.productType,
          animalType: li.animalType ?? null,
          byproductType: li.byproductType ?? null,
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

  static async markPaid(id: string): Promise<SalesTransactionModel> {
    const tx = await this.findIdCheck(id);
    if (tx.paymentStatus === PAYMENT_STATUS.PAID)
      throw new Error("Transaction already paid");
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
    if (doc.dateRange?.startDate || doc.dateRange?.endDate) {
      const range: Record<symbol, Date> = {};
      if (doc.dateRange.startDate)
        range[Op.gte] = new Date(doc.dateRange.startDate);
      if (doc.dateRange.endDate)
        range[Op.lte] = new Date(doc.dateRange.endDate);
      Object.assign(where, { transactionDate: range });
    }

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
          { model: SalesLineItemModel, as: "lineItems" },
          { model: ShipmentModel, as: "shipment" },
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
    if (!tx) return;
    const sum =
      ((await SalesInstallmentModel.sum("amountMnt", {
        where: { salesTransactionId: txId },
        transaction: t,
      })) as number | null) ?? 0;
    const total = Number(tx.amount);
    const paidEnough = sum >= total - 0.01;
    if (paidEnough && tx.paymentStatus !== PAYMENT_STATUS.PAID) {
      const latest = await SalesInstallmentModel.findOne({
        where: { salesTransactionId: txId },
        order: [["paidAt", "DESC"]],
        transaction: t,
      });
      await tx.update(
        {
          paymentStatus: PAYMENT_STATUS.PAID,
          paidAt: latest?.paidAt ?? new Date(),
        },
        { transaction: t },
      );
    } else if (!paidEnough && tx.paymentStatus === PAYMENT_STATUS.PAID) {
      await tx.update(
        { paymentStatus: PAYMENT_STATUS.PENDING, paidAt: null },
        { transaction: t },
      );
    }
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
