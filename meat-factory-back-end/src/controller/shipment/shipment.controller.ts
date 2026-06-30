import { Op, UniqueConstraintError, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { ShipmentModel } from "../../models/shipment/shipment.model";
import { ShipmentCargoEntryModel } from "../../models/shipment/shipment-cargo-entry.model";
import { ShipmentPhotoModel } from "../../models/shipment/shipment-photo.model";
import { ShipmentSaleLineModel } from "../../models/shipment/shipment-sale-line.model";
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
import { FileController } from "../global/file.controller";
import {
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
          category: doc.category,
          domesticMarket,
          customerId: doc.customerId,
          weightKg: 0,
          status: SHIPMENT_STATUS.PENDING,
          loadedById: context.id,
          vehiclePlate: doc.vehiclePlate?.trim() || null,
          driverName: doc.driverName?.trim() || null,
          driverPhone: doc.driverPhone?.trim() || null,
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
  //   BYPRODUCT → "BYPN:<byproductName>"
  private static _groupKey(
    productType: PRODUCT_TYPE,
    animalType: string | null,
    byproductName: string | null,
  ): string {
    return productType === PRODUCT_TYPE.MEAT
      ? `MEAT:${animalType}`
      : `BYPN:${byproductName}`;
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
      const animalType =
        productType === PRODUCT_TYPE.MEAT ? r.animalType : null;
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
  // cargo manifest. Meat deducts MEAT:<animalType>; byproducts deduct
  // BYPN:<name>.
  private static async _buildOutLines(
    shipment: ShipmentModel,
  ): Promise<TStockLine[]> {
    const groups = await this._groupEntries(shipment.id);
    const lines = groups
      .filter((g) => g.totalWeightKg > 0)
      .map((g) => ({
        productType: g.productType,
        animalType: g.productType === PRODUCT_TYPE.MEAT ? g.animalType : null,
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
      });
      return shipment;
    }

    await shipment.update({ status });
    return shipment;
  }

  // Cached grand total = Σ(group weight × group price) over priced sale lines.
  // Null when nothing is priced yet. Recomputed whenever a price or a weight
  // changes.
  private static async _recomputeTotal(shipmentId: string): Promise<void> {
    const lines = await ShipmentSaleLineModel.findAll({
      where: { shipmentId },
    });
    let total = 0;
    let anyPriced = false;
    for (const l of lines) {
      if (l.pricePerKg != null) {
        anyPriced = true;
        total += Number(l.totalWeightKg) * Number(l.pricePerKg);
      }
    }
    await ShipmentModel.update(
      { totalPrice: anyPriced ? Number(total.toFixed(2)) : null },
      { where: { id: shipmentId } },
    );
  }

  // End-of-load pricing: insert a selling price per kg on one product group.
  // Editable only while PENDING (like the rest of the shipment). Pass null
  // to clear.
  static async setSalePrice(
    id: string,
    pricePerKg: number | null,
  ): Promise<ShipmentSaleLineModel> {
    const line = await findOrThrow(
      ShipmentSaleLineModel,
      id,
      "Үнийн мөр олдсонгүй",
    );
    this._assertEditable(await this.findIdCheck(line.shipmentId));
    if (pricePerKg == null) {
      line.pricePerKg = null;
    } else {
      const p = Number(pricePerKg);
      if (!Number.isFinite(p) || p < 0)
        throw new Error("Үнэ сөрөг байж болохгүй");
      line.pricePerKg = Number(p.toFixed(2));
    }
    await line.save();
    await this._recomputeTotal(line.shipmentId);
    await ShipmentModel.update(
      { pricedAt: new Date() },
      { where: { id: line.shipmentId } },
    );
    return line;
  }

  static async list(
    doc: TGetShipments,
  ): Promise<TPaginationGeneric<TShipment>> {
    const where: WhereOptions = {};
    if (doc.status) Object.assign(where, { status: doc.status });
    if (doc.category) Object.assign(where, { category: doc.category });
    if (doc.domesticMarket)
      Object.assign(where, { domesticMarket: doc.domesticMarket });
    if (doc.customerId) Object.assign(where, { customerId: doc.customerId });
    if (doc.dateRange?.startDate || doc.dateRange?.endDate) {
      const range: Record<symbol, Date> = {};
      if (doc.dateRange.startDate)
        range[Op.gte] = new Date(doc.dateRange.startDate);
      if (doc.dateRange.endDate)
        range[Op.lte] = new Date(doc.dateRange.endDate);
      Object.assign(where, { createdAt: range });
    }

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
        { model: ShipmentSaleLineModel, as: "saleLines" },
      ],
    });
  }

  // Loading info: driver name/phone, vehicle plate. Editable only while PENDING
  // — fill these before marking the shipment LOADED. (serialNumber is
  // auto-assigned, not editable here.)
  static async updateLoadingInfo(
    id: string,
    args: {
      vehiclePlate?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
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
  // by product (meat type / byproduct) into sale lines, which carry the
  // per-kg selling price set at end of load (see _resyncManifest).
  //
  // Locking rule: a shipment is editable ONLY while PENDING — cargo, pricing
  // and loading info all freeze the moment it's marked LOADED. The only thing
  // allowed past PENDING is the forward status transition.

  private static _assertEditable(shipment: ShipmentModel): void {
    if (shipment.status !== SHIPMENT_STATUS.PENDING)
      throw new Error(
        "Зөвхөн хүлээгдэж буй (PENDING) ачилтыг өөрчлөх боломжтой",
      );
  }

  // Recompute everything derived from the cargo manifest after an add/delete:
  //   1. Upsert one sale line per product group (preserving entered prices),
  //      dropping groups that no longer have any cargo.
  //   2. Resync the shipment's aggregate weightKg.
  //   3. Recompute the cached grand total.
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
    await this._recomputeTotal(shipmentId);
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
