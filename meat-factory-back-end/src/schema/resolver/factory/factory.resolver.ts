import { FactoryController } from "../../../controller/factory/factory.controller";
import {
  TCreateFactory,
  TSetFactoryByproduct,
  TUpdateFactory,
} from "../../../types/factory/factory.type";
import { wrapItems, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    factories: wrapItems(
      "factories",
      async (doc: { includeInactive?: boolean | null }) =>
        FactoryController.all(!!doc.includeInactive),
    ),
    factoryByproducts: wrapItems(
      "factoryByproducts",
      ({ factory }: { factory: string }) =>
        FactoryController.byproducts(factory),
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
    setFactoryByproduct: wrapVoid("Хадгалагдлаа", (doc: TSetFactoryByproduct) =>
      FactoryController.setByproduct(doc),
    ),
    deleteFactoryByproduct: wrapVoid("Хасагдлаа", ({ id }: { id: string }) =>
      FactoryController.removeByproduct(id),
    ),
  },
};
