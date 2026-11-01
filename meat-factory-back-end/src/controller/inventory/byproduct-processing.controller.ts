import { WhereOptions } from "sequelize";
import { FactoryController } from "../factory/factory.controller";
import sequelize from "../../config/db-connection";
import { ByproductProcessingModel } from "../../models/inventory/byproduct-processing.model";
import { ByproductProcessingLineModel } from "../../models/inventory/byproduct-processing-line.model";
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
} from "../../types/inventory/byproduct-processing.type";
import {
  MOVEMENT_SOURCE,
  MOVEMENT_TYPE,
} from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import {
  TContext,
  TDateRange,
  TPaginationGeneric,
} from "../../types/global/global.type";
import {
  dateRangeWhere,
  dateStampUTC8,
  findOrThrow,
  listPaginated,
  nextDailyCounter,
  round2,
} from "../../utils";


const PROCESSING_INCLUDE = [
  {
    model: ByproductWrapperModel,
    as: "wrapper",
    include: [{ model: AnimalModel, as: "animal" }],
  },
  { model: ByproductProcessingLineModel, as: "lines" },
  { model: AdminModel, as: "createdBy" },
];

// Byproduct-kind factory flow: the intake sites send counted гэдэс here,
// where batches are disassembled and every organ weighed. Each batch keeps the
// norm-based expectation next to the weighed actual so the two can be matched.
export class ByproductProcessingController {
  // Disassemble N гэдэс of one wrapper and record each organ's weighed kg.
  // Stock: −N гэдэс (pieces), +actual kg per organ.
  static async create(
    doc: TCreateByproductProcessing,
    context: TContext,
  ): Promise<ByproductProcessingModel> {
    const factory = AdminController.writeFactory(context, doc.factory);
    if (!FactoryController.rules(factory).processesByproducts)
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
    requested?: string | null,
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
