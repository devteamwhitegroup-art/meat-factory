import { RoleController } from "../../../controller/user/role.controller";
import { TCreateRole, TUpdateRole } from "../../../types/user/role.type";
import { wrapItems, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    roles: wrapItems("roles", () => RoleController.list()),
    permissionCatalog: wrapItems("groups", async () => RoleController.catalog()),
  },
  Mutation: {
    createRole: wrapOne(
      "role",
      (doc: TCreateRole) => RoleController.create(doc),
      "Эрх үүсгэлээ",
    ),
    updateRole: wrapOne(
      "role",
      (doc: TUpdateRole) => RoleController.update(doc),
      "Эрх хадгалагдлаа",
    ),
    deleteRole: wrapVoid("Эрх устгалаа", (doc: { id: string }) =>
      RoleController.delete(doc.id),
    ),
  },
};
