import { ByproductProcessingController } from "../../../controller/inventory/byproduct-processing.controller";
import {
  TCreateByproductProcessing,
  TGetByproductProcessings,
  TTransferByproducts,
} from "../../../types/inventory/byproduct-processing.type";
import { TDateRange } from "../../../types/global/global.type";
import { FACTORY } from "../../../types/user/admin.type";
import { wrapItems, wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
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
        { dateRange, factory }: { dateRange?: TDateRange; factory?: FACTORY },
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
    transferByproducts: wrapVoid(
      "Дайврын үйлдвэр рүү илгээлээ",
      (doc: TTransferByproducts, ctx) =>
        ByproductProcessingController.transfer(doc, ctx),
    ),
  },
};
