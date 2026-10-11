import { FactoryController } from "../../../controller/factory/factory.controller";
import {
  TCreateFactory,
  TUpdateFactory,
} from "../../../types/factory/factory.type";
import { wrapItems, wrapOne } from "../../../utils";

export default {
  Query: {
    factories: wrapItems(
      "factories",
      async (doc: { includeInactive?: boolean | null }) =>
        FactoryController.all(!!doc.includeInactive),
    ),
  },
  Mutation: {
    createFactory: wrapOne(
      "factory",
      (doc: TCreateFactory) => FactoryController.create(doc),
      "Үйлдвэр үүсгэлээ",
    ),
    updateFactory: wrapOne(
      "factory",
      (doc: TUpdateFactory) => FactoryController.update(doc),
      "Үйлдвэр хадгалагдлаа",
    ),
  },
};
