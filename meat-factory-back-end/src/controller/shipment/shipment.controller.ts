import { Transaction, WhereOptions, col, fn } from "sequelize";
import sequelize from "../../config/db-connection";
import { ShipmentModel } from "../../models/shipment/shipment.model";
import { ShipmentCargoEntryModel } from "../../models/shipment/shipment-cargo-entry.model";
import { ShipmentPhotoModel } from "../../models/shipment/shipment-photo.model";
import { ShipmentSaleLineModel } from "../../models/shipment/shipment-sale-line.model";
import { ShipmentSaleEntryModel } from "../../models/shipment/shipment-sale-entry.model";
import { CustomerModel } from "../../models/customer/customer.model";
import { ByproductConstantModel } from "../../models/livestock/byproduct-constant.model";
import { ByproductWrapperModel } from "../../models/livestock/byproduct-wrapper.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { FileModel } from "../../models/global/file.model";
import { AdminModel } from "../../models/user/admin.model";
import { SalesTransactionModel } from "../../models/sales/sales-transaction.model";
import {
  DOMESTIC_MARKET,
  SHIPMENT_CATEGORY,
  SHIPMENT_STATUS,
  TCreateShipment,
  TGetShipments,
  TShipment,
  TShipmentStockRow,
} from "../../types/shipment/shipment.type";
import { CUSTOMER_KIND } from "../../types/customer/customer.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { CustomerController } from "../customer/customer.controller";
import { AnimalController } from "../livestock/animal.controller";
import {
  InventoryController,
  stockKey,
  stockLabel,
} from "../inventory/inventory.controller";
import { AdminController } from "../user/admin.controller";
import { SalesTransactionController } from "../sales/sales-transaction.controller";
import { FileController } from "../global/file.controller";
import {
  EPS,
  createWithUniqueCode,
  dateRangeWhere,
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
  round2,
} from "../../utils";

const FORWARD: Record<SHIPMENT_STATUS, SHIPMENT_STATUS | null> = {
  [SHIPMENT_STATUS.PENDING]: SHIPMENT_STATUS.LOADED,
  [SHIPMENT_STATUS.LOADED]: SHIPMENT_STATUS.DELIVERED,
  [SHIPMENT_STATUS.DELIVERED]: null,
};

// Who buys what: export trucks go to a factory buyer, domestic ones to the
// broker of their sub-market. (The FE scopes its customer picker the same way.)
const buyerKind = (
  category: SHIPMENT_CATEGORY,
  market: DOMESTIC_MARKET | null,
): CUSTOMER_KIND =>
  category === SHIPMENT_CATEGORY.EXPORT
    ? CUSTOMER_KIND.FACTORY
    : market === DOMESTIC_MARKET.ULAANBAATAR
      ? CUSTOMER_KIND.ULAANBAATAR_BROKER
      : CUSTOMER_KIND.LOCAL_BROKER;

type TGroup = {
  productType: PRODUCT_TYPE;
  animalId: string | null;
  byproductName: string | null;
  groupKey: string;
  totalWeightKg: number;
};

// Sales-report totals of one product group: Σ sold kg and Σ kg × price (null
// until anything is reported). The single formula behind income sync, the
// auto-invoice, the GraphQL soldKg/amount fields and costing analytics.
export function saleTotals(
  entries: { weightKg: number | string; pricePerKg: number | string }[],
): { soldKg: number; amount: number | null; pricePerKg: number | null } {
  let kg = 0;
  let amount = 0;
  for (const e of entries) {
    kg += Number(e.weightKg);
    amount += Number(e.weightKg) * Number(e.pricePerKg);
  }
  return {
    soldKg: round2(kg),
    amount: entries.length ? round2(amount) : null,
    pricePerKg: kg > 0 ? round2(amount / kg) : null,
  };
}

const SALE_LINE_INCLUDE = () => [
  { model: AnimalModel, as: "animal", attributes: ["id", "name"] },
  {
    model: ShipmentSaleEntryModel,
    as: "entries",
    include: [{ model: AdminModel, as: "createdBy", attributes: ["id", "param"] }],
  },
];

export class ShipmentController {
  // Factory seal (лац) number: exactly 6 digits, optional.
  private static _seal(raw: string | null | undefined): string | null {
    const seal = raw?.trim() || null;
    if (seal && !/^\d{6}$/.test(seal))
      throw new Error("Лацны дугаар 6 оронтой тоо байна");
    return seal;
  }

  static findIdCheck(id: string): Promise<ShipmentModel> {
    return findOrThrow(ShipmentModel, id, "Ачилт олдсонгүй");
  }

  // A shipment the actor's factory may touch. With a transaction it is
  // row-locked, so every mutation on one shipment runs one at a time: a
  // double-clicked DELIVERED can't deduct stock twice, two cargo adds can't
  // take the same sequence number.
  static async load(
    id: string,
    context: TContext,
    t?: Transaction,
  ): Promise<ShipmentModel> {
    const s = await findOrThrow(
      ShipmentModel,
      id,
      "Ачилт олдсонгүй",
      t ? { transaction: t, lock: t.LOCK.UPDATE } : undefined,
    );
    AdminController.assertFactory(context, s.factory);
    return s;
  }

  // Today's shipment-code prefix: SHIP-YYYYMMDD- (Mongolia day).
  private static _codePrefix(): string {
    return `SHIP-${dateStampUTC8()}-`;
  }

  // Preview today's next loading serial (the per-day counter) WITHOUT inserting.
  // Informational only (racy); the real value is fixed at create time.
  static previewNextSerial(): Promise<number> {
    return nextDailyCounter(ShipmentModel, "shipmentCode", this._codePrefix());
  }

  static async create(
    doc: TCreateShipment,
    context: TContext,
  ): Promise<ShipmentModel> {
    if (!doc.category) throw new Error("Ачилтын төрөл шаардлагатай");
    const factory = AdminController.writeFactory(context, doc.factory);

    // DOMESTIC shipments carry a sub-market (LOCAL / ULAANBAATAR); EXPORT does not.
    let domesticMarket: DOMESTIC_MARKET | null = null;
    if (doc.category === SHIPMENT_CATEGORY.DOMESTIC) {
      const m = doc.domesticMarket;
      if (!m || !Object.values(DOMESTIC_MARKET).includes(m))
        throw new Error(
          "Дотоодын зах зээл (орон нутаг/Улаанбаатар) сонгоно уу",
        );
      domesticMarket = m;
    }

    if (!doc.customerId) throw new Error("Харилцагч сонгоно уу");
    const customer = await CustomerController.findIdCheck(doc.customerId);
    if (customer.kind !== buyerKind(doc.category, domesticMarket))
      throw new Error("Энэ ачилтад тохирох төрлийн харилцагч сонгоно уу");
    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    // SHIP-YYYYMMDD-N; N (the per-day counter) is also the serialNumber.
    // Weight is derived from the cargo manifest, so it starts at 0.
    const prefix = this._codePrefix();
    const first = await nextDailyCounter(ShipmentModel, "shipmentCode", prefix);
    return createWithUniqueCode((attempt, t) =>
      ShipmentModel.create(
        {
          shipmentCode: `${prefix}${first + attempt}`,
          serialNumber: first + attempt,
          factory,
          category: doc.category,
          domesticMarket,
          customerId: doc.customerId,
          weightKg: 0,
          status: SHIPMENT_STATUS.PENDING,
          loadedById: context.id,
          vehiclePlate: doc.vehiclePlate?.trim() || null,
          driverName: doc.driverName?.trim() || null,
          driverPhone: doc.driverPhone?.trim() || null,
          sealNumber: this._seal(doc.sealNumber),
          notes: doc.notes ?? null,
          photoFileId: doc.photoFileId ?? null,
        },
        { transaction: t },
      ),
    );
  }

  // The cargo manifest summed per product group (one stockKey each).
  private static async _groups(
    shipmentId: string,
    t: Transaction,
  ): Promise<TGroup[]> {
    const rows = (await ShipmentCargoEntryModel.findAll({
      attributes: [
        "productType",
        "animalId",
        "byproductName",
        [fn("SUM", col("weight_kg")), "kg"],
      ],
      where: { shipmentId },
      group: ["product_type", "animal_id", "byproduct_name"],
      raw: true,
      transaction: t,
    })) as unknown as (Omit<TGroup, "groupKey" | "totalWeightKg"> & {
      kg: string;
    })[];
    return rows.map((r) => ({
      productType: r.productType,
      animalId: r.animalId,
      byproductName: r.byproductName,
      groupKey: stockKey(r),
      totalWeightKg: round2(Number(r.kg)),
    }));
  }

  // What's still loadable at the shipment's factory (cargo form helper).
  static async availableStock(
    shipmentId: string,
    context: TContext,
  ): Promise<TShipmentStockRow[]> {
    const shipment = await this.load(shipmentId, context);
    return [...(await InventoryController.available(shipment.factory)).values()]
      .filter((r) => r.onHandKg > 0 || r.reservedKg > 0)
      .sort((a, b) => a.groupKey.localeCompare(b.groupKey));
  }

  // Before the cargo freezes at LOADED: every group must still be covered,
  // otherwise DELIVERED could never deduct it.
  private static async _assertStockCovers(
    shipment: ShipmentModel,
    t: Transaction,
  ): Promise<void> {
    const stock = await InventoryController.available(shipment.factory, t);
    for (const g of await this._groups(shipment.id, t)) {
      const s = stock.get(g.groupKey);
      if (s && s.availableKg < 0)
        throw new Error(
          `Нөөц хүрэлцэхгүй: ${stockLabel({ ...s, animalName: s.animalType })} — нөөцөд ${s.onHandKg} кг, нээлттэй ачилтуудад ${s.reservedKg} кг`,
        );
    }
  }

  static async updateStatus(
    id: string,
    status: SHIPMENT_STATUS,
    context: TContext,
  ): Promise<ShipmentModel> {
    return sequelize.transaction(async (t) => {
      const shipment = await this.load(id, context, t);

      // Undo "loaded" (nothing has left the ledger yet) so cargo can be fixed.
      if (
        shipment.status === SHIPMENT_STATUS.LOADED &&
        status === SHIPMENT_STATUS.PENDING
      ) {
        if (
          await ShipmentSaleEntryModel.count({
            where: { shipmentId: id },
            transaction: t,
          })
        )
          throw new Error(
            "Борлуулалтын тайлан бичигдсэн тул буцаах боломжгүй — эхлээд тайлангийн мөрүүдийг устгана уу",
          );
        return shipment.update({ status }, { transaction: t });
      }
      if (FORWARD[shipment.status] !== status)
        throw new Error(
          `Invalid status transition from ${shipment.status} to ${status}`,
        );

      if (status === SHIPMENT_STATUS.LOADED)
        await this._assertStockCovers(shipment, t);

      if (status === SHIPMENT_STATUS.DELIVERED) {
        // Stock leaves by what was actually loaded — the grouped manifest.
        const lines = (await this._groups(id, t))
          .filter((g) => g.totalWeightKg > 0)
          .map((g) => ({
            factory: shipment.factory,
            productType: g.productType,
            animalId: g.animalId,
            byproductName: g.byproductName,
            quantityKg: g.totalWeightKg,
          }));
        if (!lines.length)
          throw new Error("Ачилтад бараа алга байна; нөөцөөс хасах боломжгүй");
        await InventoryController.applyShipmentOut({ shipmentId: id, lines }, t);
        await shipment.update(
          { status, shippedAt: new Date() },
          { transaction: t },
        );
        // Auto-invoice from the manifest; prices follow the sales report.
        await SalesTransactionController.createFromShipment(shipment, t);
        return shipment;
      }

      return shipment.update({ status }, { transaction: t });
    });
  }

  // Income comes from the salesman's sales report: each sale line's price =
  // its report average, the shipment total = Σ reported amounts (null until
  // anything is reported), and the auto-created invoice follows.
  private static async _syncIncome(
    shipmentId: string,
    t: Transaction,
  ): Promise<void> {
    const lines = await ShipmentSaleLineModel.findAll({
      where: { shipmentId },
      include: [{ model: ShipmentSaleEntryModel, as: "entries" }],
      transaction: t,
    });
    let total = 0;
    let reported = false;
    for (const l of lines) {
      const s = saleTotals(l.entries ?? []);
      if (s.amount != null) {
        reported = true;
        total += s.amount;
      }
      const current = l.pricePerKg == null ? null : Number(l.pricePerKg);
      if (current !== s.pricePerKg)
        await l.update({ pricePerKg: s.pricePerKg }, { transaction: t });
    }
    await ShipmentModel.update(
      {
        totalPrice: reported ? round2(total) : null,
        pricedAt: reported ? new Date() : null,
      },
      { where: { id: shipmentId }, transaction: t },
    );
    await SalesTransactionController.syncFromShipment(shipmentId, t);
  }

  // Salesman's report: kg of one product group sold at a price. Only once
  // the shipment has left (LOADED / DELIVERED). A group can't sell more than
  // was loaded.
  static async addSaleEntry(
    saleLineId: string,
    weightKg: number,
    pricePerKg: number,
    context: TContext,
  ): Promise<ShipmentSaleEntryModel> {
    const kg = round2(Number(weightKg));
    const price = round2(Number(pricePerKg));
    if (!(kg > 0)) throw new Error("Жин 0-ээс их байх ёстой");
    if (!Number.isFinite(price) || price < 0)
      throw new Error("Үнэ сөрөг байж болохгүй");
    const { shipmentId } = await findOrThrow(
      ShipmentSaleLineModel,
      saleLineId,
      "Барааны мөр олдсонгүй",
    );

    return sequelize.transaction(async (t) => {
      this._assertSold(await this.load(shipmentId, context, t));
      const line = await findOrThrow(
        ShipmentSaleLineModel,
        saleLineId,
        "Барааны мөр олдсонгүй",
        { include: SALE_LINE_INCLUDE(), transaction: t },
      );
      const { soldKg } = saleTotals(line.entries ?? []);
      const loaded = Number(line.totalWeightKg);
      if (soldKg + kg > loaded + EPS)
        throw new Error(
          `${stockLabel({ ...line.get(), animalName: line.animal?.name })}: ачсан ${loaded} кг-аас их борлуулах боломжгүй (бүртгэсэн ${soldKg} кг)`,
        );
      const entry = await ShipmentSaleEntryModel.create(
        {
          shipmentId,
          saleLineId,
          weightKg: kg,
          pricePerKg: price,
          createdById: context.id,
        },
        { transaction: t },
      );
      await this._syncIncome(shipmentId, t);
      return entry;
    });
  }

  static async deleteSaleEntry(id: string, context: TContext): Promise<void> {
    const { shipmentId } = await findOrThrow(
      ShipmentSaleEntryModel,
      id,
      "Борлуулалтын мөр олдсонгүй",
    );
    await sequelize.transaction(async (t) => {
      this._assertSold(await this.load(shipmentId, context, t));
      await ShipmentSaleEntryModel.destroy({ where: { id }, transaction: t });
      await this._syncIncome(shipmentId, t);
    });
  }

  private static _assertSold(shipment: ShipmentModel): void {
    if (shipment.status === SHIPMENT_STATUS.PENDING)
      throw new Error("Борлуулалтыг ачилт гарсны дараа бүртгэнэ");
  }

  static async list(
    doc: TGetShipments,
    context: TContext,
  ): Promise<TPaginationGeneric<TShipment>> {
    const where: WhereOptions = {};
    const factory = AdminController.readFactory(context, doc.factory);
    if (factory) Object.assign(where, { factory });
    if (doc.status) Object.assign(where, { status: doc.status });
    if (doc.category) Object.assign(where, { category: doc.category });
    if (doc.domesticMarket)
      Object.assign(where, { domesticMarket: doc.domesticMarket });
    if (doc.customerId) Object.assign(where, { customerId: doc.customerId });
    Object.assign(where, dateRangeWhere(doc.dateRange, "createdAt"));

    return listPaginated(ShipmentModel, doc, {
      where,
      include: [{ model: CustomerModel, as: "customer" }],
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  static async getById(id: string, context: TContext): Promise<ShipmentModel> {
    const s = await findOrThrow(ShipmentModel, id, "Ачилт олдсонгүй", {
      include: [
        { model: CustomerModel, as: "customer" },
        { model: FileModel, as: "photo" },
        {
          model: ShipmentCargoEntryModel,
          as: "cargoEntries",
          separate: true,
          order: [["sequenceNo", "ASC"]],
          include: [
            { model: AdminModel, as: "createdBy" },
            { model: AnimalModel, as: "animal", attributes: ["id", "name"] },
          ],
        },
        {
          model: ShipmentPhotoModel,
          as: "photos",
          separate: true,
          order: [["sequenceNo", "ASC"]],
          include: [{ model: FileModel, as: "file" }],
        },
        {
          model: ShipmentSaleLineModel,
          as: "saleLines",
          separate: true,
          include: SALE_LINE_INCLUDE(),
        },
        { model: SalesTransactionModel, as: "salesTransaction" },
      ],
    });
    AdminController.assertFactory(context, s.factory);
    return s;
  }

  // Loading info: driver name/phone, vehicle plate, factory seal number.
  // Editable only while PENDING. (serialNumber is auto-assigned.)
  static async updateLoadingInfo(
    id: string,
    args: {
      vehiclePlate?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      sealNumber?: string | null;
    },
    context: TContext,
  ): Promise<ShipmentModel> {
    const s = await this.load(id, context);
    this._assertEditable(s);
    if (args.vehiclePlate !== undefined)
      s.vehiclePlate = args.vehiclePlate?.trim() || null;
    if (args.driverName !== undefined)
      s.driverName = args.driverName?.trim() || null;
    if (args.driverPhone !== undefined)
      s.driverPhone = args.driverPhone?.trim() || null;
    if (args.sealNumber !== undefined)
      s.sealNumber = this._seal(args.sealNumber);
    return s.save();
  }

  // Multi-photo manifest. fileId references an already-uploaded File row
  // (created via the /file/upload route with type='shipment').
  static async addPhoto(
    shipmentId: string,
    fileId: string,
    context: TContext,
  ): Promise<ShipmentPhotoModel> {
    await FileController.findIdCheck(fileId);
    return sequelize.transaction(async (t) => {
      await this.load(shipmentId, context, t);
      const maxSeq =
        ((await ShipmentPhotoModel.max("sequenceNo", {
          where: { shipmentId },
          transaction: t,
        })) as number | null) ?? 0;
      return ShipmentPhotoModel.create(
        { shipmentId, fileId, sequenceNo: maxSeq + 1 },
        { transaction: t },
      );
    });
  }

  static async removePhoto(id: string, context: TContext): Promise<void> {
    const row = await findOrThrow(ShipmentPhotoModel, id, "Зураг олдсонгүй");
    await this.load(row.shipmentId, context);
    await row.destroy();
  }

  // ─── Cargo manifest (per-load weights) ────────────────────────────
  //
  // A cargo entry is one boxed/weighed load. The storekeeper appends one row
  // per scale read while loading. Entries group by product (stockKey) into
  // sale lines (_resyncManifest); prices come later from the sales report.
  // A shipment is editable ONLY while PENDING — cargo and loading info
  // freeze at LOADED.

  private static _assertEditable(shipment: ShipmentModel): void {
    if (shipment.status !== SHIPMENT_STATUS.PENDING)
      throw new Error(
        "Зөвхөн хүлээгдэж буй (PENDING) ачилтыг өөрчлөх боломжтой",
      );
  }

  // After an add/delete: one sale line per product group (stale ones
  // dropped) and the shipment's total weight.
  private static async _resyncManifest(
    shipmentId: string,
    t: Transaction,
  ): Promise<void> {
    const groups = await this._groups(shipmentId, t);
    const existing = new Map(
      (
        await ShipmentSaleLineModel.findAll({
          where: { shipmentId },
          transaction: t,
        })
      ).map((e) => [e.groupKey, e]),
    );
    const fresh = [];
    for (const g of groups) {
      const ex = existing.get(g.groupKey);
      existing.delete(g.groupKey);
      if (!ex) fresh.push({ ...g, shipmentId, pricePerKg: null });
      else if (Number(ex.totalWeightKg) !== g.totalWeightKg)
        await ex.update({ totalWeightKg: g.totalWeightKg }, { transaction: t });
    }
    if (fresh.length)
      await ShipmentSaleLineModel.bulkCreate(fresh, { transaction: t });
    if (existing.size)
      await ShipmentSaleLineModel.destroy({
        where: { id: [...existing.values()].map((e) => e.id) },
        transaction: t,
      });
    await ShipmentModel.update(
      { weightKg: round2(groups.reduce((s, g) => s + g.totalWeightKg, 0)) },
      { where: { id: shipmentId }, transaction: t },
    );
  }

  // What product a cargo line is: MEAT by animal name, BYPRODUCT by the
  // catalogue constant the FE picked (its wrapper's animal is part of the key).
  private static async _cargoProduct(
    shipment: ShipmentModel,
    args: {
      productType: PRODUCT_TYPE;
      animalType?: string | null;
      sourceConstantId?: string | null;
    },
  ): Promise<{
    productType: PRODUCT_TYPE;
    animalId: string | null;
    byproductName: string | null;
    sourceConstantId: string | null;
    label: string;
  }> {
    if (args.productType === PRODUCT_TYPE.MEAT) {
      if (!args.animalType?.trim()) throw new Error("Махны төрөл буруу байна");
      const animal = await AnimalController.resolveByName(args.animalType);
      if (shipment.category === SHIPMENT_CATEGORY.EXPORT && !animal.isExport)
        throw new Error("Экспортын ачилт зөвхөн экспортын махтай байна");
      return {
        productType: PRODUCT_TYPE.MEAT,
        animalId: animal.id,
        byproductName: null,
        sourceConstantId: null,
        label: stockLabel({ productType: PRODUCT_TYPE.MEAT, animalName: animal.name }),
      };
    }
    // ponytail: byproducts are domestic-only, a fixed rule — make it a
    // catalogue flag (like Animal.isExport) if a byproduct ever ships abroad.
    if (shipment.category === SHIPMENT_CATEGORY.EXPORT)
      throw new Error("Экспортын ачилтад дайвар бүтээгдэхүүн ачих боломжгүй");
    if (!args.sourceConstantId)
      throw new Error("Дайвар бүтээгдэхүүн сонгоно уу");
    const constant = await findOrThrow(
      ByproductConstantModel,
      args.sourceConstantId,
      "Дайвар бүтээгдэхүүн олдсонгүй",
      {
        include: [
          {
            model: ByproductWrapperModel,
            as: "wrapper",
            include: [{ model: AnimalModel, as: "animal" }],
          },
        ],
      },
    );
    return {
      productType: PRODUCT_TYPE.BYPRODUCT,
      animalId: constant.wrapper?.animal?.id ?? null,
      byproductName: constant.name,
      sourceConstantId: constant.id,
      label: constant.name,
    };
  }

  // Net weight: gross − tare (the storekeeper's notebook math), else the
  // directly supplied net.
  private static _net(args: {
    grossKg?: number | null;
    tareKg?: number | null;
    weightKg?: number | null;
  }): { gross: number | null; tare: number | null; net: number } {
    const num = (v: number | null | undefined) =>
      v != null && Number.isFinite(Number(v)) ? Number(v) : null;
    const gross = num(args.grossKg);
    const tare = num(args.tareKg);
    if (gross != null && tare != null) {
      if (gross <= 0) throw new Error("Нийт махны жин эерэг тоо");
      if (tare < 0) throw new Error("Савны жин сөрөг байж болохгүй");
      if (tare >= gross)
        throw new Error("Савны жин нь нийт махны жингээс бага байх ёстой");
      return { gross, tare, net: round2(gross - tare) };
    }
    const w = num(args.weightKg);
    if (w == null)
      throw new Error("Жин оруулаагүй байна (нийт махны/сав эсвэл цэвэр)");
    if (w <= 0) throw new Error("Цэвэр жин эерэг тоо");
    return { gross: null, tare: null, net: round2(w) };
  }

  static async addCargoEntry(
    shipmentId: string,
    args: {
      productType: PRODUCT_TYPE;
      // MEAT lines — the animal catalogue name.
      animalType?: string | null;
      // BYPRODUCT lines — the catalogue constant (name derived).
      sourceConstantId?: string | null;
      // Optional sub-cut label; defaults to the product's name.
      productLabel?: string | null;
      pieceCount?: number | null;
      grossKg?: number | null;
      tareKg?: number | null;
      // Direct net weight; ignored when grossKg+tareKg both provided.
      weightKg?: number | null;
    },
    context: TContext,
  ): Promise<ShipmentCargoEntryModel> {
    const { gross, tare, net } = this._net(args);
    const pieces =
      args.pieceCount != null && Number.isFinite(Number(args.pieceCount))
        ? Math.max(0, Math.floor(Number(args.pieceCount)))
        : null;

    return sequelize.transaction(async (t) => {
      const shipment = await this.load(shipmentId, context, t);
      this._assertEditable(shipment);
      const product = await this._cargoProduct(shipment, {
        ...args,
        productType: args.productType ?? PRODUCT_TYPE.MEAT,
      });
      const free =
        (await InventoryController.available(shipment.factory, t)).get(
          stockKey(product),
        )?.availableKg ?? 0;
      if (net > free)
        throw new Error(
          `Нөөц хүрэлцэхгүй: ${product.label} — ${Math.max(0, free)} кг үлдсэн`,
        );
      const maxSeq =
        ((await ShipmentCargoEntryModel.max("sequenceNo", {
          where: { shipmentId },
          transaction: t,
        })) as number | null) ?? 0;
      const entry = await ShipmentCargoEntryModel.create(
        {
          shipmentId,
          productType: product.productType,
          animalId: product.animalId,
          byproductName: product.byproductName,
          sourceConstantId: product.sourceConstantId,
          productLabel: args.productLabel?.trim() || product.label,
          pieceCount: pieces,
          grossKg: gross,
          tareKg: tare,
          weightKg: net,
          sequenceNo: maxSeq + 1,
          createdById: context.id,
        },
        { transaction: t },
      );
      await this._resyncManifest(shipmentId, t);
      return entry;
    });
  }

  static async deleteCargoEntry(id: string, context: TContext): Promise<void> {
    const { shipmentId } = await findOrThrow(
      ShipmentCargoEntryModel,
      id,
      "Ачилтын мөр олдсонгүй",
    );
    await sequelize.transaction(async (t) => {
      this._assertEditable(await this.load(shipmentId, context, t));
      await ShipmentCargoEntryModel.destroy({ where: { id }, transaction: t });
      await this._resyncManifest(shipmentId, t);
    });
  }
}
