import { Op, WhereOptions } from "sequelize";
import { OrderModel } from "../../models/order/order.model";
import { OrderPackageModel } from "../../models/order/order-package.model";
import {
  ORDER_STATUS,
  TCreateOrder,
  TCreateOrderPackage,
  TGetOrders,
  TOrderLine,
  TPackageItem,
  TUpdateOrderPackage,
} from "../../types/order/order.type";
import { TPaginationGeneric } from "../../types/global/global.type";
import {
  createWithUniqueCode,
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
} from "../../utils";
import { QPay, TQPayInvoice } from "./qpay";

// Package catalogue — admin-managed in the dashboard, listed on the landing page.
export class OrderPackageController {
  static findIdCheck(id: string): Promise<OrderPackageModel> {
    return findOrThrow(OrderPackageModel, id, "Багц олдсонгүй");
  }

  private static _items(items: TPackageItem[] | null | undefined): TPackageItem[] {
    return (items ?? [])
      .map((i) => ({ name: (i.name ?? "").trim(), kg: i.kg ?? null }))
      .filter((i) => {
        if (i.kg !== null && !(i.kg > 0)) throw new Error(`${i.name}: кг 0-ээс их байх ёстой`);
        return i.name;
      });
  }

  private static _price(price: number): number {
    if (!Number.isInteger(price) || price <= 0) throw new Error("Үнэ эерэг бүхэл тоо байх ёстой");
    return price;
  }

  static listActive(): Promise<OrderPackageModel[]> {
    return OrderPackageModel.findAll({ where: { isActive: true }, order: [["price", "ASC"]] });
  }

  static list(): Promise<OrderPackageModel[]> {
    return OrderPackageModel.findAll({ order: [["createdAt", "DESC"]] });
  }

  static create(doc: TCreateOrderPackage): Promise<OrderPackageModel> {
    if (!doc.name?.trim()) throw new Error("Багцын нэр шаардлагатай");
    return OrderPackageModel.create({
      name: doc.name.trim(),
      description: doc.description?.trim() || null,
      price: this._price(doc.price),
      items: this._items(doc.items),
    });
  }

  static async update(doc: TUpdateOrderPackage): Promise<OrderPackageModel> {
    const p = await this.findIdCheck(doc.id);
    if (doc.name !== undefined) {
      if (!doc.name?.trim()) throw new Error("Багцын нэр шаардлагатай");
      p.name = doc.name.trim();
    }
    if (doc.description !== undefined) p.description = doc.description?.trim() || null;
    if (doc.price !== undefined) p.price = this._price(doc.price);
    if (doc.items !== undefined) p.items = this._items(doc.items);
    if (typeof doc.isActive === "boolean") p.isActive = doc.isActive;
    return p.save();
  }

  // Orders keep a snapshot of the package, so deleting never breaks history.
  static async remove(id: string): Promise<void> {
    await (await this.findIdCheck(id)).destroy();
  }
}

export type TOrderPayment = {
  orderId: string;
  code: string;
  total: number;
  status: ORDER_STATUS;
  qrImage?: string | null;
  qrText?: string | null;
  shortUrl?: string | null;
  urls?: TQPayInvoice["urls"];
};

// Staff-driven moves. PENDING → PAID covers money received outside QPay.
const NEXT: Record<ORDER_STATUS, ORDER_STATUS[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

// Mongolian mobile: 8 digits, optional +976 prefix.
export function normalizePhone(raw: string | null | undefined): string {
  const d = (raw ?? "").replace(/\D/g, "");
  const p = d.length === 11 && d.startsWith("976") ? d.slice(3) : d;
  if (!/^\d{8}$/.test(p)) throw new Error("Утасны дугаар 8 оронтой байх ёстой");
  return p;
}

export class OrderController {
  // Public (landing page). Prices come from the DB, never from the client.
  // ponytail: no rate limit on this public mutation; add one (per-IP) if spam shows up.
  static async create(doc: TCreateOrder): Promise<TOrderPayment> {
    const customerName = doc.customerName?.trim() ?? "";
    if (customerName.length < 2 || customerName.length > 100) throw new Error("Нэрээ оруулна уу");
    const phone = normalizePhone(doc.phone);
    const address = doc.address?.trim() ?? "";
    if (address.length < 5 || address.length > 500) throw new Error("Хүргэлтийн хаягаа дэлгэрэнгүй оруулна уу");
    const note = doc.note?.trim().slice(0, 1000) || null;

    if (!doc.lines?.length || doc.lines.length > 20) throw new Error("Багц сонгоно уу");
    const pkgs = await OrderPackageModel.findAll({
      where: { id: doc.lines.map((l) => l.packageId), isActive: true },
    });
    const byId = new Map(pkgs.map((p) => [p.id, p]));
    const lines: TOrderLine[] = doc.lines.map((l) => {
      const p = byId.get(l.packageId);
      if (!p) throw new Error("Сонгосон багц идэвхгүй болсон байна. Хуудсаа шинэчилнэ үү");
      if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 50)
        throw new Error("Тоо ширхэг 1-50 байх ёстой");
      return { packageId: p.id, name: p.name, unitPrice: p.price, quantity: l.quantity, items: p.items };
    });
    const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

    const prefix = `ORD-${dateStampUTC8()}-`;
    const first = await nextDailyCounter(OrderModel, "code", prefix);
    const order = await createWithUniqueCode((attempt, t) =>
      OrderModel.create(
        { code: `${prefix}${first + attempt}`, customerName, phone, address, note, lines, total },
        { transaction: t },
      ),
    );

    // No invoice → no order: a dangling unpayable PENDING row helps nobody.
    let inv: TQPayInvoice;
    try {
      inv = await QPay.createInvoice(order);
    } catch (err) {
      await order.destroy();
      throw err;
    }
    order.qpayInvoiceId = inv.invoice_id;
    await order.save();
    return {
      orderId: order.id,
      code: order.code,
      total,
      status: order.status,
      qrImage: inv.qr_image,
      qrText: inv.qr_text,
      shortUrl: inv.qPay_shortUrl ?? null,
      urls: inv.urls ?? [],
    };
  }

  // Public: the landing page polls this; the QPay callback route calls it too.
  // Order ids are UUIDs and the reply carries no personal data.
  static async checkPayment(id: string): Promise<TOrderPayment> {
    const order = await findOrThrow(OrderModel, id, "Захиалга олдсонгүй");
    if (order.status === ORDER_STATUS.PENDING && order.qpayInvoiceId) {
      const paid = await QPay.paidAmount(order.qpayInvoiceId);
      if (paid >= order.total) {
        // Conditional update: callback and poll may race; only one flips it.
        await OrderModel.update(
          { status: ORDER_STATUS.PAID, paidAt: new Date() },
          { where: { id, status: ORDER_STATUS.PENDING } },
        );
        await order.reload();
      }
    }
    return { orderId: order.id, code: order.code, total: order.total, status: order.status };
  }

  static list(doc: TGetOrders): Promise<TPaginationGeneric<OrderModel>> {
    const where: WhereOptions = {};
    if (doc.status) Object.assign(where, { status: doc.status });
    const q = doc.search?.trim();
    if (q)
      Object.assign(where, {
        [Op.or]: ["code", "customerName", "phone"].map((c) => ({ [c]: { [Op.iLike]: `%${q}%` } })),
      });
    return listPaginated(OrderModel, doc, { where, order: [["createdAt", "DESC"]] });
  }

  static async setStatus(id: string, status: ORDER_STATUS): Promise<OrderModel> {
    const order = await findOrThrow(OrderModel, id, "Захиалга олдсонгүй");
    if (!NEXT[order.status].includes(status))
      throw new Error(`${order.status} → ${status} шилжих боломжгүй`);
    order.status = status;
    if (status === ORDER_STATUS.PAID) order.paidAt = new Date();
    return order.save();
  }
}
