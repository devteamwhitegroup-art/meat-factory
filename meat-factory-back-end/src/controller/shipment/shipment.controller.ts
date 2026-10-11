import { Transaction, UniqueConstraintError, WhereOptions } from "sequelize";
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
import {
  DOMESTIC_MARKET,
  SHIPMENT_CATEGORY,
  SHIPMENT_STATUS,
  TCreateShipment,
  TGetShipments,
  TShipment,
} from "../../types/shipment/shipment.type";
import { TStockLine } from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { CustomerController } from "../customer/customer.controller";
import { AnimalController } from "../livestock/animal.controller";
import { InventoryController } from "../inventory/inventory.controller";
import { AdminController } from "../user/admin.controller";
import { SalesTransactionController } from "../sales/sales-transaction.controller";
import { SalesTransactionModel } from "../../models/sales/sales-transaction.model";
import { FileController } from "../global/file.controller";
import {
  dateRangeWhere,
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
} from "../../utils";

const MAX_CODE_RETRIES = 5;

const FORWARD: Record<SHIPMENT_STATUS, SHIPMENT_STATUS | null> = {
  [SHIPMENT_STATUS.PENDING]: SHIPMENT_STATUS.LOADED,
  [SHIPMENT_STATUS.LOADED]: SHIPMENT_STATUS.DELIVERED,
  [SHIPMENT_STATUS.DELIVERED]: null,
};

export class ShipmentController {
  // Factory seal (лац) number: exactly 6 digits, optional.
  private static _seal(raw: string | null | undefined): string | null {
    const seal = raw?.trim() || null;
    if (seal && !/^\d{6}$/.test(seal))
      throw new Error("Лацны дугаар 6 оронтой тоо байна");
    return seal;
  }

  static findIdCheck(id: string): Promise<ShipmentModel> {
    return findOrThrow(ShipmentModel, id, "Shipment not found");
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

    // DOMESTIC shipments carry a sub-market (LOCAL / ULAANBAATAR); EXPORT does
    // not. Force the value to match the category.
    let domesticMarket: DOMESTIC_MARKET | null = null;
    if (doc.category === SHIPMENT_CATEGORY.DOMESTIC) {
      const m = doc.domesticMarket;
      if (!m || !Object.values(DOMESTIC_MARKET).includes(m))
        throw new Error(
          "Дотоодын зах зээл (орон нутаг/Улаанбаатар) сонгоно уу",
        );
      domesticMarket = m;
    }

    // Every shipment is tied to a customer (the FE creates one inline when new).
    if (!doc.customerId) throw new Error("Харилцагч сонгоно уу");
    await CustomerController.findIdCheck(doc.customerId);

    // Weight is derived from the cargo manifest (resynced on each add/delete),
    // so it starts at 0.
    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    // Human-readable id: SHIP-YYYYMMDD-N, where N is the per-day counter (also
    // stored as serialNumber). On a same-day collision bump N and retry.
    const prefix = this._codePrefix();
    let counter = await nextDailyCounter(ShipmentModel, "shipmentCode", prefix);

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      try {
        return await ShipmentModel.create({
          shipmentCode: `${prefix}${counter}`,
          serialNumber: counter,
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
        });
      } catch (err) {
        if (
          err instanceof UniqueConstraintError &&
          attempt < MAX_CODE_RETRIES - 1
        ) {
          counter++;
          continue;
        }
        throw err;
      }
    }
    throw new Error("Failed to generate a unique shipment code");
  }

  // Dedup/grouping key for a load line: one key per inventory SKU.
  //   MEAT      → "MEAT:<animalType>"
  //   BYPRODUCT → "BYPN:<animalType>:<byproductName>" (animal-less free-form /
  //               legacy cargo keeps "BYPN:<byproductName>")
  private static _groupKey(
    productType: PRODUCT_TYPE,
    animalType: string | null,
    byproductName: string | null,
  ): string {
    return productType === PRODUCT_TYPE.MEAT
      ? `MEAT:${animalType}`
      : `BYPN:${animalType ? `${animalType}:` : ""}${byproductName}`;
  }

  // Aggregate the cargo manifest into one row per product group (meat type or
  // byproduct), summing net weight.
  private static async _groupEntries(shipmentId: string): Promise<
    {
      productType: PRODUCT_TYPE;
      animalType: string | null;
      byproductName: string | null;
      groupKey: string;
      totalWeightKg: number;
    }[]
  > {
    const rows = await ShipmentCargoEntryModel.findAll({
      where: { shipmentId },
    });
    const groups = new Map<
      string,
      {
        productType: PRODUCT_TYPE;
        animalType: string | null;
        byproductName: string | null;
        groupKey: string;
        totalWeightKg: number;
      }
    >();
    for (const r of rows) {
      const productType = r.productType;
      const animalType = r.animalType;
      const byproductName =
        productType === PRODUCT_TYPE.BYPRODUCT ? r.byproductName : null;
      const key = this._groupKey(productType, animalType, byproductName);
      const g = groups.get(key) ?? {
        productType,
        animalType,
        byproductName,
        groupKey: key,
        totalWeightKg: 0,
      };
      g.totalWeightKg += Number(r.weightKg);
      groups.set(key, g);
    }
    for (const g of groups.values())
      g.totalWeightKg = Number(g.totalWeightKg.toFixed(2));
    return Array.from(groups.values());
  }

  // Inventory deduction is driven by what was actually loaded — the grouped
  // cargo manifest. Meat deducts MEAT:<animalId>; byproducts deduct
  // BYPN:<name>. Cargo entries only ever store the catalogue name (validated
  // at entry time in addCargoEntry), so resolve name → id here at the
  // inventory boundary rather than threading animalId through cargo/sale
  // lines too.
  private static async _buildOutLines(
    shipment: ShipmentModel,
  ): Promise<TStockLine[]> {
    const groups = await this._groupEntries(shipment.id);
    const animalTypes = Array.from(
      new Set(
        groups
          .filter((g) => g.animalType && g.totalWeightKg > 0)
          .map((g) => g.animalType as string),
      ),
    );
    const typeToId =
      animalTypes.length > 0
        ? await AnimalController.mapNamesToIds(animalTypes)
        : {};
    const lines = groups
      .filter((g) => g.totalWeightKg > 0)
      .map((g) => ({
        factory: shipment.factory,
        productType: g.productType,
        animalId: g.animalType ? typeToId[g.animalType] : null,
        byproductName:
          g.productType === PRODUCT_TYPE.BYPRODUCT ? g.byproductName : null,
        quantityKg: g.totalWeightKg,
      }));
    if (lines.length === 0)
      throw new Error("Ачилтад бараа алга байна; нөөцөөс хасах боломжгүй");
    return lines;
  }

  static async updateStatus(
    id: string,
    status: SHIPMENT_STATUS,
  ): Promise<ShipmentModel> {
    const shipment = await this.findIdCheck(id);
    if (FORWARD[shipment.status] !== status) {
      throw new Error(
        `Invalid status transition from ${shipment.status} to ${status}`,
      );
    }

    if (status === SHIPMENT_STATUS.DELIVERED) {
      const lines = await this._buildOutLines(shipment);
      await sequelize.transaction(async (t) => {
        await InventoryController.applyShipmentOut(
          { shipmentId: shipment.id, lines },
          t,
        );
        await shipment.update(
          { status, shippedAt: new Date() },
          { transaction: t },
        );
        // Auto-invoice: admin no longer has to manually re-enter the weight/
        // customer on a separate sales transaction. Prices come from the
        // sales report — null lines until reported, synced as it fills in.
        await SalesTransactionController.createFromShipment(shipment, t);
      });
      return shipment;
    }

    await shipment.update({ status });
    return shipment;
  }

  // Income comes from the salesman's sales report (ShipmentSaleEntry): each
  // sale line's price = average of its report lines, the shipment total =
  // Σ reported kg × price (null until anything is reported), and the
  // auto-created sales transaction follows.
  private static async _syncIncome(
    shipmentId: string,
    t?: Transaction,
  ): Promise<void> {
    const lines = await ShipmentSaleLineModel.findAll({
      where: { shipmentId },
      include: [{ model: ShipmentSaleEntryModel, as: "entries" }],
      transaction: t,
    });
    let total = 0;
    let reported = false;
    for (const l of lines) {
      const entries = l.entries ?? [];
      const kg = entries.reduce((sum, e) => sum + Number(e.weightKg), 0);
      const amount = entries.reduce(
        (sum, e) => sum + Number(e.weightKg) * Number(e.pricePerKg),
        0,
      );
      if (entries.length > 0) reported = true;
      total += amount;
      await l.update(
        { pricePerKg: kg > 0 ? Number((amount / kg).toFixed(2)) : null },
        { transaction: t },
      );
    }
    await ShipmentModel.update(
      {
        totalPrice: reported ? Number(total.toFixed(2)) : null,
        pricedAt: reported ? new Date() : null,
      },
      { where: { id: shipmentId }, transaction: t },
    );
    await SalesTransactionController.syncFromShipment(shipmentId, t);
  }

  // Salesman's report: kg of one product group sold at a price. Only once
  // the shipment has left (LOADED / DELIVERED) — income is known after the
  // sale. A group can't sell more than was loaded.
  static async addSaleEntry(
    saleLineId: string,
    weightKg: number,
    pricePerKg: number,
    context: TContext,
  ): Promise<ShipmentSaleEntryModel> {
    const line = await findOrThrow(
      ShipmentSaleLineModel,
      saleLineId,
      "Барааны мөр олдсонгүй",
    );
    this._assertSold(await this.findIdCheck(line.shipmentId));
    const kg = Number(weightKg);
    const price = Number(pricePerKg);
    if (!(kg > 0)) throw new Error("Жин 0-ээс их байх ёстой");
    if (!Number.isFinite(price) || price < 0)
      throw new Error("Үнэ сөрөг байж болохгүй");
    const sold =
      ((await ShipmentSaleEntryModel.sum("weightKg", {
        where: { saleLineId },
      })) as number | null) ?? 0;
    const loaded = Number(line.totalWeightKg);
    if (Number(sold) + kg > loaded + 0.001)
      throw new Error(
        `${line.animalType ?? line.byproductName}: ачсан ${loaded} кг-аас их борлуулах боломжгүй (бүртгэсэн ${Number(sold)} кг)`,
      );

    return sequelize.transaction(async (t) => {
      const entry = await ShipmentSaleEntryModel.create(
        {
          shipmentId: line.shipmentId,
          saleLineId,
          weightKg: Number(kg.toFixed(2)),
          pricePerKg: Number(price.toFixed(2)),
          createdById: context.id,
        },
        { transaction: t },
      );
      await this._syncIncome(line.shipmentId, t);
      return entry;
    });
  }

  static async deleteSaleEntry(id: string): Promise<void> {
    const entry = await findOrThrow(
      ShipmentSaleEntryModel,
      id,
      "Борлуулалтын мөр олдсонгүй",
    );
    this._assertSold(await this.findIdCheck(entry.shipmentId));
    await sequelize.transaction(async (t) => {
      await entry.destroy({ transaction: t });
      await this._syncIncome(entry.shipmentId, t);
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

  static getById(id: string): Promise<ShipmentModel> {
    return findOrThrow(ShipmentModel, id, "Shipment not found", {
      include: [
        { model: CustomerModel, as: "customer" },
        { model: FileModel, as: "photo" },
        {
          model: ShipmentCargoEntryModel,
          as: "cargoEntries",
          include: [{ model: AdminModel, as: "createdBy" }],
        },
        {
          model: ShipmentPhotoModel,
          as: "photos",
          include: [{ model: FileModel, as: "file" }],
        },
        {
          model: ShipmentSaleLineModel,
          as: "saleLines",
          include: [
            {
              model: ShipmentSaleEntryModel,
              as: "entries",
              include: [
                {
                  model: AdminModel,
                  as: "createdBy",
                  attributes: ["id", "param"],
                },
              ],
            },
          ],
        },
        { model: SalesTransactionModel, as: "salesTransaction" },
      ],
    });
  }

  // Loading info: driver name/phone, vehicle plate, factory seal number.
  // Editable only while PENDING — fill these before marking the shipment
  // LOADED. (serialNumber is auto-assigned, not editable here.)
  static async updateLoadingInfo(
    id: string,
    args: {
      vehiclePlate?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      sealNumber?: string | null;
    },
  ): Promise<ShipmentModel> {
    const s = await this.findIdCheck(id);
    this._assertEditable(s);
    if (args.vehiclePlate !== undefined)
      s.vehiclePlate = args.vehiclePlate?.trim() || null;
    if (args.driverName !== undefined)
      s.driverName = args.driverName?.trim() || null;
    if (args.driverPhone !== undefined)
      s.driverPhone = args.driverPhone?.trim() || null;
    if (args.sealNumber !== undefined)
      s.sealNumber = this._seal(args.sealNumber);
    await s.save();
    return s;
  }

  // Multi-photo manifest. fileId references an already-uploaded File row
  // (created via the existing /file/upload route with type='shipment').
  static async addPhoto(
    shipmentId: string,
    fileId: string,
  ): Promise<ShipmentPhotoModel> {
    await this.findIdCheck(shipmentId);
    await FileController.findIdCheck(fileId);
    return await sequelize.transaction(async (t) => {
      const maxSeq: number =
        ((await ShipmentPhotoModel.max("sequenceNo", {
          where: { shipmentId },
          transaction: t,
        })) as number | null) ?? 0;
      return await ShipmentPhotoModel.create(
        { shipmentId, fileId, sequenceNo: maxSeq + 1 },
        { transaction: t },
      );
    });
  }

  static async removePhoto(id: string): Promise<void> {
    const row = await findOrThrow(ShipmentPhotoModel, id, "Зураг олдсонгүй");
    await row.destroy();
  }

  // ─── Cargo manifest (per-load weights) ────────────────────────────
  //
  // A cargo entry is one boxed/weighed load on the shipment. The storekeeper
  // appends one row per scale read while loading the truck. Entries are grouped
  // by product (meat type / byproduct) into sale lines (see _resyncManifest);
  // their selling price comes later from the sales report (addSaleEntry).
  //
  // Locking rule: a shipment is editable ONLY while PENDING — cargo and
  // loading info freeze the moment it's marked LOADED. Past PENDING only the
  // forward status transition and the sales report are allowed.

  private static _assertEditable(shipment: ShipmentModel): void {
    if (shipment.status !== SHIPMENT_STATUS.PENDING)
      throw new Error(
        "Зөвхөн хүлээгдэж буй (PENDING) ачилтыг өөрчлөх боломжтой",
      );
  }

  // Recompute everything derived from the cargo manifest after an add/delete:
  //   1. Upsert one sale line per product group, dropping groups that no
  //      longer have any cargo.
  //   2. Resync the shipment's aggregate weightKg.
  private static async _resyncManifest(shipmentId: string): Promise<void> {
    const groups = await this._groupEntries(shipmentId);
    const existing = await ShipmentSaleLineModel.findAll({
      where: { shipmentId },
    });
    const byKey = new Map(existing.map((e) => [e.groupKey, e]));

    for (const g of groups) {
      const ex = byKey.get(g.groupKey);
      if (ex) {
        ex.totalWeightKg = g.totalWeightKg;
        await ex.save();
        byKey.delete(g.groupKey);
      } else {
        await ShipmentSaleLineModel.create({
          shipmentId,
          productType: g.productType,
          animalType: g.animalType,
          byproductName: g.byproductName,
          groupKey: g.groupKey,
          totalWeightKg: g.totalWeightKg,
          pricePerKg: null,
        });
      }
    }
    // Leftover sale lines no longer backed by any cargo entry.
    for (const stale of byKey.values()) await stale.destroy();

    const weight = Number(
      groups.reduce((s, g) => s + g.totalWeightKg, 0).toFixed(2),
    );
    await ShipmentModel.update(
      { weightKg: weight },
      { where: { id: shipmentId } },
    );
  }

  static async addCargoEntry(
    shipmentId: string,
    args: {
      productType: PRODUCT_TYPE;
      // Required for MEAT lines — the animal catalogue name.
      animalType?: string | null;
      // BYPRODUCT lines: sourceConstantId (name derived) or free-form name.
      byproductName?: string | null;
      sourceConstantId?: string | null;
      // Optional sub-cut label; defaults to the picked type's name.
      productLabel?: string | null;
      pieceCount?: number | null;
      grossKg?: number | null;
      tareKg?: number | null;
      // Direct net weight; ignored when grossKg+tareKg both provided.
      weightKg?: number | null;
    },
    context: TContext,
  ): Promise<ShipmentCargoEntryModel> {
    const shipment = await this.findIdCheck(shipmentId);
    this._assertEditable(shipment);

    const productType = args.productType ?? PRODUCT_TYPE.MEAT;
    let animalType: string | null = null;
    let byproductName: string | null = null;
    let sourceConstantId: string | null = null;
    let defaultLabel: string;

    if (productType === PRODUCT_TYPE.MEAT) {
      if (!args.animalType?.trim()) throw new Error("Махны төрөл буруу байна");
      // Resolve against the catalogue (throws if unknown).
      const animal = await AnimalController.resolveByName(args.animalType);
      // Export trucks carry export-flagged meat only (horse, for now).
      if (shipment.category === SHIPMENT_CATEGORY.EXPORT && !animal.isExport)
        throw new Error("Экспортын ачилт зөвхөн экспортын махтай байна");
      animalType = animal.name;
      defaultLabel = `${animal.name} мах`;
    } else {
      // Byproducts are domestic-only.
      if (shipment.category === SHIPMENT_CATEGORY.EXPORT)
        throw new Error("Экспортын ачилтад дайвар бүтээгдэхүүн ачих боломжгүй");
      if (args.sourceConstantId) {
        // Authoritative: derive the name from the catalogue entry the FE picked.
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
        byproductName = constant.name;
        sourceConstantId = constant.id;
        animalType = constant.wrapper?.animal?.name ?? null;
      } else {
        const n = (args.byproductName ?? "").trim();
        if (!n) throw new Error("Дайвар бүтээгдэхүүний нэр шаардлагатай");
        byproductName = n;
      }
      defaultLabel = byproductName;
    }

    const label = (args.productLabel ?? "").trim() || defaultLabel;

    // Net weight derivation: prefer gross-minus-tare (the storekeeper's
    // notebook math); fall back to the directly-supplied net.
    const gross =
      args.grossKg != null && Number.isFinite(Number(args.grossKg))
        ? Number(args.grossKg)
        : null;
    const tare =
      args.tareKg != null && Number.isFinite(Number(args.tareKg))
        ? Number(args.tareKg)
        : null;
    let net: number | null;
    if (gross != null && tare != null) {
      if (gross <= 0) throw new Error("Нийт махны жин эерэг тоо");
      if (tare < 0) throw new Error("Савны жин сөрөг байж болохгүй");
      if (tare >= gross)
        throw new Error("Савны жин нь нийт махныы жингээс бага байх ёстой");
      net = Number((gross - tare).toFixed(2));
    } else if (args.weightKg != null) {
      const w = Number(args.weightKg);
      if (!Number.isFinite(w) || w <= 0) throw new Error("Цэвэр жин эерэг тоо");
      net = Number(w.toFixed(2));
    } else {
      throw new Error("Жин оруулаагүй байна (нийт махны/сав эсвэл цэвэр)");
    }

    const pieces =
      args.pieceCount != null && Number.isFinite(Number(args.pieceCount))
        ? Math.max(0, Math.floor(Number(args.pieceCount)))
        : null;

    const entry = await sequelize.transaction(async (t) => {
      const maxSeq: number =
        ((await ShipmentCargoEntryModel.max("sequenceNo", {
          where: { shipmentId },
          transaction: t,
        })) as number | null) ?? 0;
      const row = await ShipmentCargoEntryModel.create(
        {
          shipmentId,
          productType,
          animalType,
          byproductName,
          sourceConstantId,
          productLabel: label,
          pieceCount: pieces,
          grossKg: gross,
          tareKg: tare,
          weightKg: net,
          sequenceNo: maxSeq + 1,
          createdById: context.id,
        },
        { transaction: t },
      );
      return row;
    });

    await this._resyncManifest(shipmentId);
    return entry;
  }

  static async deleteCargoEntry(id: string, _context: TContext): Promise<void> {
    const entry = await findOrThrow(
      ShipmentCargoEntryModel,
      id,
      "Ачилтын мөр олдсонгүй",
    );
    const shipment = await this.findIdCheck(entry.shipmentId);
    this._assertEditable(shipment);
    const { shipmentId } = entry;
    await entry.destroy();
    await this._resyncManifest(shipmentId);
  }
}
