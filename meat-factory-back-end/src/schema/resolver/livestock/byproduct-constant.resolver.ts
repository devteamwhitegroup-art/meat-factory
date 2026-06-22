import { ByproductConstantController } from "../../../controller/livestock/byproduct-constant.controller";
import {
  TCreateByproductConstant,
  TGetByproductConstants,
  TUpdateByproductConstant,
} from "../../../types/livestock/byproduct-constant.type";
import { wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    byproductConstants: wrapList(
      "byproductConstants",
      (doc: TGetByproductConstants) => ByproductConstantController.list(doc),
    ),
    byproductConstant: wrapOne("byproductConstant", ({ id }: { id: string }) =>
      ByproductConstantController.getById(id),
    ),
  },
  Mutation: {
    createByproductConstant: wrapOne(
      "byproductConstant",
      (doc: TCreateByproductConstant) =>
        ByproductConstantController.create(doc),
      "Дайвар норм нэмэгдлээ",
    ),
    updateByproductConstant: wrapOne(
      "byproductConstant",
      (doc: TUpdateByproductConstant) =>
        ByproductConstantController.update(doc),
      "Дайвар норм шинэчлэгдлээ",
    ),
    deleteByproductConstant: wrapVoid(
      "Дайвар норм устгагдлаа",
      ({ id }: { id: string }) => ByproductConstantController.remove(id),
    ),
  },
};
