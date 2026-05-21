import { GraphQLSchema, defaultFieldResolver } from "graphql";
import {
  mapSchema,
  //   getDirective,
  MapperKind,
  getDirectives,
} from "@graphql-tools/utils";
import { isEmpty } from "lodash";
import { AdminController } from "../../controller/user/admin.controller";
import { CONTEXT_ENUM, TContext } from "../../types/global/global.type";
// import { TContextCompany } from '../../types/global/global.type';

export const authDirectiveTransformer = async (schema: GraphQLSchema) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirectives(schema, fieldConfig, [
        "adminAuth",
        "companyAuth",
        "sellerAuth",
      ])?.[0];

      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        const { name, args } = authDirective;
        // `@adminAuth(permissions: [String!])` -> args = { permissions: string[] }

        fieldConfig.resolve = async function (root, fieldArgs, context, info) {
          try {
            const tokenIsEmpty = isEmpty(context.token);
            if (tokenIsEmpty) {
              throw new Error("Token is empty");
            }

            if (name === "adminAuth") {
              const admin = await AdminController.getTokenInfo(context.token);
              if (!admin) {
                throw new Error("Admin not found");
              }

              // Enforce role membership when `permissions` is supplied.
              // No `permissions` => any authenticated staff member passes.
              const permissions: string[] = Array.isArray(args?.permissions)
                ? args.permissions
                : [];
              if (
                permissions.length > 0 &&
                !permissions.includes(admin.staffRole)
              ) {
                throw new Error("Insufficient permission");
              }

              return resolve(
                root,
                fieldArgs,
                {
                  ...context,
                  role: CONTEXT_ENUM.ADMIN,
                  id: admin.id,
                  staffRole: admin.staffRole,
                } as TContext,
                info,
              );
            }

            return resolve(root, fieldArgs, context, info);
          } catch (error) {
            return {
              success: false,
              message: error.message,
            };
          }
        };
      }

      return fieldConfig;
    },
  });
};
