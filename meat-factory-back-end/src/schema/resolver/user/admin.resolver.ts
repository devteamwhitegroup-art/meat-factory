import { AdminController } from "../../../controller/user/admin.controller";
import {
  TAdmin,
  TAdminLoginInput,
  TCreateAdmin,
} from "../../../types/user/admin.type";
import { errorMessage, wrapList, wrapOne, wrapVoid } from "../../../utils";

export default {
  Query: {
    currentAdmin: wrapOne("admin", (_args, context) =>
      AdminController.currentAdmin(context),
    ),
    admins: wrapList("admins", (_args, context) =>
      AdminController.getAdmins(context),
    ),
  },
  Mutation: {
    // Two-payload envelope (admin + token) — kept explicit; the wrap helpers
    // only build a single data key.
    loginAdmin: async (_: unknown, doc: TAdminLoginInput) => {
      try {
        const { admin, token } = await AdminController.login(doc);
        return { success: true, message: "Login successful", admin, token };
      } catch (error) {
        return {
          success: false,
          message: errorMessage(error),
          admin: null,
          token: null,
        };
      }
    },
    createAdmin: wrapOne(
      "admin",
      (doc: TCreateAdmin, context) => AdminController.createAdmin(doc, context),
      "Admin created successfully",
    ),
    updateAdmin: wrapOne(
      "admin",
      (doc: Partial<TAdmin> & { id: string }, context) =>
        AdminController.updateAdmin(doc, context),
      "Admin updated successfully",
    ),
    deleteAdmin: wrapVoid("Admin deleted successfully", (doc: { id: string }, context) =>
      AdminController.deleteAdmin(doc, context),
    ),
  },
};
