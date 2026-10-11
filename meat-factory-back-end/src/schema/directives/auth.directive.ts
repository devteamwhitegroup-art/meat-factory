import {
  GraphQLSchema,
  defaultFieldResolver,
  GraphQLResolveInfo,
} from "graphql";
import { mapSchema, MapperKind, getDirectives } from "@graphql-tools/utils";
import { isEmpty } from "lodash";
import { AdminController } from "../../controller/user/admin.controller";
import { TBaseContext, TContext } from "../../types/global/global.type";
import { PERMISSION } from "../../types/user/permission.type";
import { errorMessage } from "../../utils";

// @authLogin — any authenticated staff member.
// @auth(permissions: [PERMISSION]) — authenticated AND the actor's role holds
// at least one of the listed permissions (read live from the DB per request).
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

        fieldConfig.resolve = async function (
          root: unknown,
          fieldArgs: Record<string, unknown>,
          context: TBaseContext,
          info: GraphQLResolveInfo,
        ) {
          try {
            if (isEmpty(context.token)) {
              throw new Error("Token is empty");
            }

            const admin = await AdminController.getTokenInfo(context.token);
            if (!admin) {
              throw new Error("Unauthorized");
            }

            if (name === "auth") {
              const permissions: PERMISSION[] = Array.isArray(args?.permissions)
                ? args.permissions
                : [];
              if (permissions.length > 0)
                AdminController.assertPermission(admin, ...permissions);
            }

            return resolve(
              root,
              fieldArgs,
              { ...context, ...admin } as TContext,
              info,
            );
          } catch (error) {
            return { success: false, message: errorMessage(error) };
          }
        };
      }

      return fieldConfig;
    },
  });
};
