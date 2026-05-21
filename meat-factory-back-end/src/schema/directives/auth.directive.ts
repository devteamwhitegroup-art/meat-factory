import { GraphQLSchema, defaultFieldResolver } from "graphql";
import { mapSchema, MapperKind, getDirectives } from "@graphql-tools/utils";
import { isEmpty } from "lodash";
import { AdminController } from "../../controller/user/admin.controller";
import { TContext } from "../../types/global/global.type";

// @authLogin — any authenticated staff member.
// @auth(permissions: [ROLE]) — authenticated AND role ∈ permissions.
export const authDirectiveTransformer = async (schema: GraphQLSchema) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirectives(schema, fieldConfig, [
        "authLogin",
        "auth",
      ])?.[0];

      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        const { name, args } = authDirective;

        fieldConfig.resolve = async function (root, fieldArgs, context, info) {
          try {
            if (isEmpty(context.token)) {
              throw new Error("Token is empty");
            }

            const admin = await AdminController.getTokenInfo(context.token);
            if (!admin) {
              throw new Error("Unauthorized");
            }

            if (name === "auth") {
              const permissions: string[] = Array.isArray(args?.permissions)
                ? args.permissions
                : [];
              if (permissions.length > 0 && !permissions.includes(admin.role)) {
                throw new Error("Insufficient permission");
              }
            }

            return resolve(
              root,
              fieldArgs,
              { ...context, id: admin.id, role: admin.role } as TContext,
              info,
            );
          } catch (error) {
            return { success: false, message: error.message };
          }
        };
      }

      return fieldConfig;
    },
  });
};
