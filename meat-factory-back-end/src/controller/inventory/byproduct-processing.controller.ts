import { Op, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { ByproductProcessingModel } from "../../models/inventory/byproduct-processing.model";
import { ByproductProcessingLineModel } from "../../models/inventory/byproduct-processing-line.model";
import { InventoryItemModel } from "../../models/inventory/inventory-item.model";
import { ByproductWrapperModel } from "../../models/livestock/byproduct-wrapper.model";
import { ByproductConstantModel } from "../../models/livestock/byproduct-constant.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AdminModel } from "../../models/user/admin.model";
import { InventoryController } from "./inventory.controller";
import { AdminController } from "../user/admin.controller";
import {
  TCreateByproductProcessing,
  TGetByproductProcessings,
  TProcessingSummaryRow,
  TTransferByproducts,
} from "../../types/inventory/byproduct-processing.type";
import {
  MOVEMENT_SOURCE,
  MOVEMENT_TYPE,
  TStockLine,
} from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import {
  TContext,
  TDateRange,
  TPaginationGeneric,
} from "../../types/global/global.type";
import { BYPRODUCT_FACTORY, FACTORY } from "../../types/user/admin.type";
import {
  dateRangeWhere,
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
} from "../../utils";

const round2 = (n: number): number => Number(n.toFixed(2));

const PROCESSING_INCLUDE = [
  {
    model: ByproductWrapperModel,
    as: "wrapper",
    include: [{ model: AnimalModel, as: "animal" }],
  },
  { model: ByproductProcessingLineModel, as: "lines" },
  { model: AdminModel, as: "createdBy" },
];

// Byproduct factory (FACTORY_3) flow: FACTORY_1/2 send counted гэдэс here,
// where batches are disassembled and every organ weighed. Each batch keeps the
// norm-based expectation next to the weighed actual so the two can be matched.
export class ByproductProcessingController {
  // FACTORY_1/2 → FACTORY_3: counted byproducts leave the sender's stock and
  // arrive at the byproduct factory in one transaction.
  static async transfer(
    doc: TTransferByproducts,
    context: TContext,
  ): Promise<void> {
    const from = AdminController.writeFactory(context, doc.fromFactory);
    if (from === BYPRODUCT_FACTORY)
      throw new Error("Дайврын үйлдвэрээс илгээх боломжгүй");
    if (!doc.lines?.length) throw new Error("Илгээх дайвар сонгоно уу");

    const items = await InventoryItemModel.findAll({
      where: {
        id: { [Op.in]: doc.lines.map((l) => l.inventoryItemId) },
        factory: from,
        productType: PRODUCT_TYPE.BYPRODUCT,
      },
    });
    const byId = new Map(items.map((i) => [i.id, i]));
    const notes = `${from} → ${BYPRODUCT_FACTORY}${doc.notes?.trim() ? `: ${doc.notes.trim()}` : ""}`;

    await sequelize.transaction(async (t) => {
      for (const l of doc.lines) {
        const item = byId.get(l.inventoryItemId);
        if (!item) throw new Error("Нөөцийн мөр олдсонгүй");
        const count = Math.floor(Number(l.count));
        if (!(count > 0)) throw new Error("Илгээх тоо эерэг байх ёстой");
        const line = (factory: FACTORY): TStockLine => ({
          factory,
          productType: PRODUCT_TYPE.BYPRODUCT,
          animalId: item.animalId,
          byproductName: item.byproductName,
          quantityKg: 0,
          quantityCount: count,
        });
        for (const [movementType, factory] of [
          [MOVEMENT_TYPE.OUT, from],
          [MOVEMENT_TYPE.IN, BYPRODUCT_FACTORY],
        ] as const)
          await InventoryController.applyMovement(
            {
              movementType,
              source: MOVEMENT_SOURCE.TRANSFER,
              line: line(factory),
              createdById: context.id,
              notes,
            },
            t,
          );
      }
    });
  }

  // Disassemble N гэдэс of one wrapper and record each organ's weighed kg.
  // Stock: −N гэдэс (pieces), +actual kg per organ.
  static async create(
    doc: TCreateByproductProcessing,
    context: TContext,
  ): Promise<ByproductProcessingModel> {
    const factory = AdminController.writeFactory(context, doc.factory);
    if (factory !== BYPRODUCT_FACTORY)
      throw new Error("Дайвар задлах нь зөвхөн дайврын үйлдвэрт хийгдэнэ");
    const bundleCount = Math.floor(Number(doc.bundleCount));
    if (!(bundleCount > 0)) throw new Error("Задлах гэдэсний тоо эерэг байх ёстой");

    const wrapper = await findOrThrow(
      ByproductWrapperModel,
      doc.wrapperId,
      "Багц олдсонгүй",
      { include: [{ model: ByproductConstantModel, as: "items" }] },
    );
    const items = (wrapper.items ?? []).filter((i) => i.isActive);
    if (items.length === 0) throw new Error("Энэ багцад дайврын норм алга");

    const actualById = new Map<string, number>();
    for (const l of doc.lines ?? []) {
      if (!items.some((i) => i.id === l.constantId))
        throw new Error("Норм энэ багцад хамаарахгүй байна");
      actualById.set(l.constantId, Number(l.actualKg));
    }
    const lines = items.map((i) => {
      const actual = actualById.get(i.id);
      if (actual == null || !Number.isFinite(actual) || actual < 0)
        throw new Error(`${i.name}: бодит жин оруулна уу`);
      const expectedCount = bundleCount * i.quantityPerAnimal;
      return {
        constantId: i.id,
        name: i.name,
        expectedCount,
        expectedKg:
          i.unitWeightKg != null
            ? round2(expectedCount * Number(i.unitWeightKg))
            : null,
        actualKg: round2(actual),
      };
    });

    // ponytail: no retry on a same-day code collision (two stations saving at
    // once) — the unique index rejects it and the user resubmits. Copy the
    // REG/SHIP retry loop if F3 ever runs parallel stations.
    const prefix = `BP-${dateStampUTC8()}-`;
    const code = `${prefix}${await nextDailyCounter(ByproductProcessingModel, "code", prefix)}`;

    const created = await sequelize.transaction(async (t) => {
      const p = await ByproductProcessingModel.create(
        {
          code,
          factory,
          wrapperId: wrapper.id,
          bundleCount,
          createdById: context.id,
          notes: doc.notes?.trim() || null,
        },
        { transaction: t },
      );
      await ByproductProcessingLineModel.bulkCreate(
        lines.map((l) => ({ ...l, processingId: p.id })),
        { transaction: t },
      );

      const base = {
        factory,
        productType: PRODUCT_TYPE.BYPRODUCT,
        animalId: wrapper.animalId,
      };
      const notes = `Задлалт ${code}`;
      await InventoryController.applyMovement(
        {
          movementType: MOVEMENT_TYPE.OUT,
          source: MOVEMENT_SOURCE.PROCESSING,
          line: {
            ...base,
            byproductName: wrapper.name,
            quantityKg: 0,
            quantityCount: bundleCount,
          },
          createdById: context.id,
          notes,
        },
        t,
      );
      for (const l of lines.filter((x) => x.actualKg > 0))
        await InventoryController.applyMovement(
          {
            movementType: MOVEMENT_TYPE.IN,
            source: MOVEMENT_SOURCE.PROCESSING,
            line: { ...base, byproductName: l.name, quantityKg: l.actualKg },
            createdById: context.id,
            notes,
          },
          t,
        );
      return p;
    });

    return this.getById(created.id, context);
  }

  static async getById(
    id: string,
    context: TContext,
  ): Promise<ByproductProcessingModel> {
    const p = await findOrThrow(ByproductProcessingModel, id, "Задлалт олдсонгүй", {
      include: PROCESSING_INCLUDE,
    });
    AdminController.assertFactory(context, p.factory);
    return p;
  }

  static async list(
    doc: TGetByproductProcessings,
    context: TContext,
  ): Promise<TPaginationGeneric<ByproductProcessingModel>> {
    const where: WhereOptions = {};
    const factory = AdminController.readFactory(context, doc.factory);
    if (factory) Object.assign(where, { factory });
    if (doc.wrapperId) Object.assign(where, { wrapperId: doc.wrapperId });
    Object.assign(where, dateRangeWhere(doc.dateRange, "createdAt"));

    return listPaginated(ByproductProcessingModel, doc, {
      where,
      include: PROCESSING_INCLUDE,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  // Expected vs actual per organ over a period — the matching report.
  static async summary(
    dateRange: TDateRange | undefined,
    context: TContext,
    requested?: FACTORY | null,
  ): Promise<TProcessingSummaryRow[]> {
    const factory = AdminController.readFactory(context, requested);
    const batches = await ByproductProcessingModel.findAll({
      where: {
        ...dateRangeWhere(dateRange, "createdAt"),
        ...(factory ? { factory } : {}),
      },
      include: PROCESSING_INCLUDE,
    });

    const map = new Map<string, TProcessingSummaryRow>();
    for (const b of batches) {
      const animalType = b.wrapper?.animal?.name ?? "";
      const wrapperName = b.wrapper?.name ?? "";
      for (const l of b.lines ?? []) {
        const key = `${animalType}|${wrapperName}|${l.name}`;
        const row = map.get(key) ?? {
          animalType,
          wrapperName,
          name: l.name,
          bundleCount: 0,
          expectedKg: 0,
          actualKg: 0,
          diffKg: 0,
          diffPercent: null,
        };
        row.bundleCount += b.bundleCount;
        row.expectedKg += Number(l.expectedKg ?? 0);
        row.actualKg += Number(l.actualKg);
        map.set(key, row);
      }
    }
    return Array.from(map.values())
      .map((r) => {
        const expectedKg = round2(r.expectedKg);
        const actualKg = round2(r.actualKg);
        const diffKg = round2(actualKg - expectedKg);
        return {
          ...r,
          expectedKg,
          actualKg,
          diffKg,
          diffPercent:
            expectedKg > 0 ? round2((diffKg / expectedKg) * 100) : null,
        };
      })
      .sort(
        (a, b) =>
          a.animalType.localeCompare(b.animalType) ||
          a.wrapperName.localeCompare(b.wrapperName) ||
          a.name.localeCompare(b.name),
      );
  }
}
