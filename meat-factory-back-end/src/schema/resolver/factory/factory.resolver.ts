import { FactoryController } from "../../../controller/factory/factory.controller";
import {
  TCreateFactory,
  TSetFactoryByproduct,
  TUpdateFactory,
} from "../../../types/factory/factory.type";
import { wrapItems, wrapOne, wrapVoid } from "../../../utils";
import { AdminController } from "../../../controller/user/admin.controller";
import { PERMISSION } from "../../../types/user/permission.type";
import { TContext } from "../../../types/global/global.type";

export default {
  Query: {
    factories: wrapItems(
      "factories",
      async (doc: { includeInactive?: boolean | null }) =>
        FactoryController.all(!!doc.includeInactive),
    ),
    // Settings reads any site; intake staff (REGISTRATION_WEIGH) only their own.
    factoryByproducts: wrapItems(
      "factoryByproducts",
      async ({ factory }: { factory: string }, context: TContext) => {
        if (!AdminController.hasPermission(context, PERMISSION.SETTINGS_MANAGE))
          AdminController.assertFactory(context, factory);
        return FactoryController.byproducts(factory);
      },
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
