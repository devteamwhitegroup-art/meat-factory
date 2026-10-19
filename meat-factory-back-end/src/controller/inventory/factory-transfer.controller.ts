import { Op, Transaction, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { FactoryTransferModel } from "../../models/inventory/factory-transfer.model";
import { FactoryTransferLineModel } from "../../models/inventory/factory-transfer-line.model";
import { InventoryItemModel } from "../../models/inventory/inventory-item.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AdminModel } from "../../models/user/admin.model";
import {
  FACTORY_TRANSFER_STATUS,
  TCreateFactoryTransfer,
  TFactoryTransfer,
  TFactoryTransferLine,
  TGetFactoryTransfers,
} from "../../types/inventory/factory-transfer.type";
import {
  MOVEMENT_SOURCE,
  MOVEMENT_TYPE,
} from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { AdminController } from "../user/admin.controller";
import { FactoryController } from "../factory/factory.controller";
import { InventoryController } from "./inventory.controller";
import { ShipmentController } from "../shipment/shipment.controller";
import {
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
} from "../../utils";

const TRANSFER_INCLUDE = [
  {
    model: FactoryTransferLineModel,
    as: "lines",
    include: [{ model: AnimalModel, as: "animal" }],
  },
  { model: AdminModel, as: "sentBy", attributes: ["id", "param"] },
  { model: AdminModel, as: "closedBy", attributes: ["id", "param"] },
];

type TLineQty = Pick<
  TFactoryTransferLine,
  "productType" | "animalId" | "byproductName" | "quantityKg" | "quantityCount"
>;

const label = (i: {
  productType: PRODUCT_TYPE;
  animal?: AnimalModel | null;
  byproductName: string | null;
}) =>
  [
    i.animal?.name,
    i.productType === PRODUCT_TYPE.MEAT ? "мах" : i.byproductName,
  ]
    .filter(Boolean)
    .join(" ");

// Factory → factory shipment, no customer or invoice. The sender's stock
// leaves when it's sent (IN_TRANSIT); the receiver confirms what arrived and
// their stock grows (RECEIVED). The sender may cancel while in transit — the
// goods return to their stock (CANCELLED). Every leg is a TRANSFER movement.
export class FactoryTransferController {
  static async create(
    doc: TCreateFactoryTransfer,
    context: TContext,
  ): Promise<FactoryTransferModel> {
    const from = AdminController.writeFactory(context, doc.fromFactory);
    if (!doc.toFactory) throw new Error("Хүлээн авах үйлдвэр сонгоно уу");
    const to = FactoryController.assertActive(doc.toFactory).code;
    if (to === from) throw new Error("Өөр үйлдвэр сонгоно уу");
    if (!doc.lines?.length) throw new Error("Илгээх бараа сонгоно уу");

    const items = await InventoryItemModel.findAll({
      where: {
        id: { [Op.in]: doc.lines.map((l) => l.inventoryItemId) },
        factory: from,
      },
      include: [{ model: AnimalModel, as: "animal", attributes: ["name"] }],
    });
    const byId = new Map(items.map((i) => [i.id, i]));
    // kg already on an open shipment's cargo can't leave too.
    const stock = await ShipmentController.stockByGroup(from);
    const seen = new Set<string>();
    const lines: TLineQty[] = doc.lines.map((l) => {
      const item = byId.get(l.inventoryItemId);
      if (!item) throw new Error("Нөөцийн мөр олдсонгүй");
      const name = label(item);
      if (seen.has(item.id)) throw new Error(`Давхардсан мөр: ${name}`);
      seen.add(item.id);
      const kg = Number(Number(l.quantityKg ?? 0).toFixed(2));
      const count = Math.floor(Number(l.quantityCount ?? 0));
      if (!(kg >= 0) || !(count >= 0) || (kg === 0 && count === 0))
        throw new Error(`${name}: жин эсвэл тоо оруулна уу`);
      const free =
        stock.get(
          ShipmentController.groupKey(
            item.productType,
            item.animal?.name ?? null,
            item.byproductName,
          ),
        )?.availableKg ?? 0;
      if (kg > free)
        throw new Error(
          `${name}: ${Math.max(0, free)} кг илгээх боломжтой (үлдсэн нь ачилтад ачигдсан)`,
        );
      // Pieces / kg beyond on-hand: applyMovement refuses below zero.
      return {
        productType: item.productType,
        animalId: item.animalId,
        byproductName: item.byproductName,
        quantityKg: kg,
        quantityCount: count,
      };
    });

    // ponytail: no retry on a same-day code collision (two senders at once) —
    // the unique index rejects it and the user resubmits, as BP- batches.
    const prefix = `TR-${dateStampUTC8()}-`;
    const code = `${prefix}${await nextDailyCounter(FactoryTransferModel, "code", prefix)}`;

    const created = await sequelize.transaction(async (t) => {
      const tr = await FactoryTransferModel.create(
        {
          code,
          fromFactory: from,
          toFactory: to,
          status: FACTORY_TRANSFER_STATUS.IN_TRANSIT,
          notes: doc.notes?.trim() || null,
          sentById: context.id,
        },
        { transaction: t },
      );
      await FactoryTransferLineModel.bulkCreate(
        lines.map((l) => ({ ...l, transferId: tr.id })),
        { transaction: t },
      );
      await this._move(tr, lines, MOVEMENT_TYPE.OUT, from, context, t);
      return tr;
    });
    return this._reload(created.id);
  }

  // Receiver confirms what arrived → into their stock.
  static receive(id: string, context: TContext): Promise<void> {
    return this._close(id, FACTORY_TRANSFER_STATUS.RECEIVED, context);
  }

  // Sender takes it back while in transit → into their stock again.
  static cancel(id: string, context: TContext): Promise<void> {
    return this._close(id, FACTORY_TRANSFER_STATUS.CANCELLED, context);
  }

  private static async _close(
    id: string,
    status: FACTORY_TRANSFER_STATUS,
    context: TContext,
  ): Promise<void> {
    await sequelize.transaction(async (t) => {
      // Row lock: a double-click can't stock the goods twice.
      const tr = await FactoryTransferModel.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!tr) throw new Error("Олдсонгүй");
      const into =
        status === FACTORY_TRANSFER_STATUS.RECEIVED
          ? tr.toFactory
          : tr.fromFactory;
      AdminController.assertFactory(context, into);
      if (tr.status !== FACTORY_TRANSFER_STATUS.IN_TRANSIT)
        throw new Error("Энэ ачилт хаагдсан байна");
      const lines = await FactoryTransferLineModel.findAll({
        where: { transferId: id },
        transaction: t,
      });
      await this._move(tr, lines, MOVEMENT_TYPE.IN, into, context, t);
      await tr.update(
        { status, closedById: context.id, closedAt: new Date() },
        { transaction: t },
      );
    });
  }

  private static async _move(
    tr: FactoryTransferModel,
    lines: TLineQty[],
    movementType: MOVEMENT_TYPE,
    factory: string,
    context: TContext,
    t: Transaction,
  ): Promise<void> {
    const notes = `${tr.code}: ${FactoryController.nameOf(tr.fromFactory)} → ${FactoryController.nameOf(tr.toFactory)}`;
    for (const l of lines)
      await InventoryController.applyMovement(
        {
          movementType,
          source: MOVEMENT_SOURCE.TRANSFER,
          line: {
            factory,
            productType: l.productType,
            animalId: l.animalId,
            byproductName: l.byproductName,
            quantityKg: Number(l.quantityKg),
            quantityCount: l.quantityCount,
          },
          createdById: context.id,
          notes,
        },
        t,
      );
  }

  // Staff see what their factory sent or receives; cross-factory roles all
  // (or one factory's, either end).
  static list(
    doc: TGetFactoryTransfers,
    context: TContext,
  ): Promise<TPaginationGeneric<TFactoryTransfer>> {
    const factory = AdminController.readFactory(context, doc.factory);
    const where: WhereOptions = {};
    if (factory)
      Object.assign(where, {
        [Op.or]: [{ fromFactory: factory }, { toFactory: factory }],
      });
    if (doc.status) Object.assign(where, { status: doc.status });
    return listPaginated(FactoryTransferModel, doc, {
      where,
      include: TRANSFER_INCLUDE,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  private static _reload(id: string): Promise<FactoryTransferModel> {
    return findOrThrow(FactoryTransferModel, id, "Олдсонгүй", {
      include: TRANSFER_INCLUDE,
    });
  }
}
