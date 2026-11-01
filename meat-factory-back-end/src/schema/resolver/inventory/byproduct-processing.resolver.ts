import { ByproductProcessingController } from "../../../controller/inventory/byproduct-processing.controller";
import {
  TCreateByproductProcessing,
  TGetByproductProcessings,
} from "../../../types/inventory/byproduct-processing.type";
import { TDateRange } from "../../../types/global/global.type";
import { TContext } from "../../../types/global/global.type";
import { PERMISSION } from "../../../types/user/permission.type";
import { AdminController } from "../../../controller/user/admin.controller";
import { wrapItems, wrapList, wrapOne } from "../../../utils";

// Processing staff weigh blind: the norm's expectation is for analytics only.
const norm =
  (key: "expectedCount" | "expectedKg") =>
  (line: Record<typeof key, unknown>, _: unknown, ctx: TContext) =>
    AdminController.hasPermission(ctx, PERMISSION.BYPRODUCT_ANALYTICS)
      ? line[key]
      : null;

export default {
  ByproductProcessingLine: {
    expectedCount: norm("expectedCount"),
    expectedKg: norm("expectedKg"),
  },
  Query: {
    byproductProcessings: wrapList(
      "processings",
      (doc: TGetByproductProcessings, ctx) =>
        ByproductProcessingController.list(doc, ctx),
    ),
    byproductProcessing: wrapOne("processing", ({ id }: { id: string }, ctx) =>
      ByproductProcessingController.getById(id, ctx),
    ),
    byproductProcessingSummary: wrapItems(
      "items",
      (
        { dateRange, factory }: { dateRange?: TDateRange; factory?: string },
        ctx,
      ) => ByproductProcessingController.summary(dateRange, ctx, factory),
    ),
  },
  Mutation: {
    createByproductProcessing: wrapOne(
      "processing",
      (doc: TCreateByproductProcessing, ctx) =>
        ByproductProcessingController.create(doc, ctx),
      "Задлалт хадгалагдлаа",
    ),
  },
};
