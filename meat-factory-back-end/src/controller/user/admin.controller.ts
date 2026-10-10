import config from "../../config";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHmac } from "node:crypto";

import {
  Attributes,
  IncludeOptions,
  Model,
  Order,
  WhereOptions,
} from "sequelize";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { AdminModel } from "../../models/user/admin.model";
import {
  ADMIN_ROLE,
  CROSS_FACTORY_ROLES,
  FACTORY,
  TAdmin,
  TAdminLoginInput,
  TCreateAdmin,
} from "../../types/user/admin.type";
import { findOrThrow } from "../../utils";

const { ADMIN_JWT_TOKEN_SALT, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = config;

export class AdminController {
  static findIdCheck(
    id: string,
    include?: Array<IncludeOptions>,
    order?: Order,
  ): Promise<TAdmin & Model> {
    return findOrThrow(AdminModel, id, "admin not found", { include, order });
  }

  static async getExistingAdmin<M extends Model>(
    where: WhereOptions<Attributes<M>>,
    withPassword: boolean = false,
  ): Promise<AdminModel> {
    let admin: AdminModel | null = null;
    if (withPassword) {
      admin = await AdminModel.scope("withPassword").findOne({
        where,
      });
    } else {
      admin = await AdminModel.findOne({
        where,
      });
    }

    if (!admin) {
      throw new Error("Admin not found");
    }

    return admin;
  }

  static async _matchPassword(
    password: string,
    adminPassword: string,
  ): Promise<void> {
    const match = await bcrypt.compare(
      createHmac("sha256", password).digest("hex"),
      adminPassword,
    );
    if (!match) throw new Error("Password do not match");
  }

  static async generateJwt(
    doc: Pick<TContext, "id" | "role">,
  ): Promise<string> {
    return jwt.sign(doc, ADMIN_JWT_TOKEN_SALT);
  }

  static async _verifyJwt(token: string): Promise<TContext> {
    return jwt.verify(token, ADMIN_JWT_TOKEN_SALT) as TContext;
  }

  static async login(
    doc: TAdminLoginInput,
  ): Promise<{ admin: TAdmin; token: string }> {
    const { param, password } = doc;

    const admin = await this.getExistingAdmin<AdminModel>(
      { param: param.toLowerCase() },
      true,
    );
    const { id } = admin;
    await this._matchPassword(password, admin.password);
    const token = await this.generateJwt({ id, role: admin.role });

    return { admin, token };
  }

  static async getTokenInfo(token: string): Promise<TContext | null> {
    if (!token) return null;
    const { id } = await this._verifyJwt(token);
    // Read the live role from the DB row (do not trust the role baked
    // into the JWT — it may have been changed/revoked since issuance).
    const admin = await this.findIdCheck(id);
    return { id, role: admin.role, factory: admin.factory };
  }

  // The actor's factory boundary: null = owner/admin (both factories).
  // Public — the per-factory data scoping in other controllers routes here.
  static scopeFactory(context: TContext): FACTORY | null {
    if (CROSS_FACTORY_ROLES.includes(context.role)) return null;
    if (!context.factory) throw new Error("Танд үйлдвэр оноогоогүй байна");
    return context.factory;
  }

  // List filter: staff → own factory; owner/admin → the one asked for, or all.
  static readFactory(
    context: TContext,
    requested?: FACTORY | null,
  ): FACTORY | null {
    return this.scopeFactory(context) ?? requested ?? null;
  }

  // Create target: staff → own factory; owner/admin must name one.
  static writeFactory(
    context: TContext,
    requested?: FACTORY | null,
  ): FACTORY {
    const factory = this.readFactory(context, requested);
    if (!factory) throw new Error("Үйлдвэр сонгоно уу");
    return factory;
  }

  // Row guard: factory staff can't reach another factory's records.
  static assertFactory(context: TContext, factory: FACTORY): void {
    const own = this.scopeFactory(context);
    if (own && own !== factory) throw new Error("Олдсонгүй");
  }

  // Owner/admin roles carry no factory; every other role needs one. A
  // factory-bound actor can only grant factory roles, in their own factory.
  static _resolveFactory(
    context: TContext,
    role: ADMIN_ROLE,
    factory?: FACTORY | null,
  ): FACTORY | null {
    const own = this.scopeFactory(context);
    if (CROSS_FACTORY_ROLES.includes(role)) {
      if (own) throw new Error("Only owner/admin can grant owner/admin roles");
      return null;
    }
    const resolved = own ?? factory;
    if (!resolved) throw new Error("factory is required for this role");
    return resolved;
  }

  // ponytail: unpaginated — staff accounts number in the tens.
  static async getAdmins(
    context: TContext,
  ): Promise<TPaginationGeneric<AdminModel>> {
    const factory = this.scopeFactory(context);
    return await AdminModel.findAndCountAll({
      where: factory ? { factory } : {},
      order: [["createdAt", "ASC"]],
    });
  }

  static async createAdmin(
    doc: TCreateAdmin,
    context: TContext,
  ): Promise<AdminModel> {
    const { param, password, role = ADMIN_ROLE.ADMIN } = doc;
    if (!param || !param.trim()) throw new Error("param is required");
    if (!password || !password.trim()) throw new Error("password is required");
    if (role && !Object.values(ADMIN_ROLE).includes(role)) {
      throw new Error(
        `role must be one of: ${Object.values(ADMIN_ROLE).join(", ")}`,
      );
    }
    const factory = this._resolveFactory(context, role, doc.factory);
    // beforeCreate hook on the model hashes the password.
    return await AdminModel.create({
      param: param.trim().toLowerCase(),
      password,
      role,
      factory,
    });
  }

  static async seedAdmin(): Promise<void> {
    await AdminModel.findOrCreate({
      where: {
        param: SEED_ADMIN_EMAIL.toLowerCase(),
      },
      defaults: {
        param: SEED_ADMIN_EMAIL.toLowerCase(),
        password: SEED_ADMIN_PASSWORD,
        role: ADMIN_ROLE.ADMIN,
      },
    });
  }

  // Dev-only: seed one staff account per operational role for testing
  // the meat-factory workflow end to end.
  static async seedStaff(): Promise<void> {
    const staff: Array<{ param: string; role: ADMIN_ROLE }> = [
      { param: "store@example.com", role: ADMIN_ROLE.STOREKEEPER },
      { param: "accountant@example.com", role: ADMIN_ROLE.ACCOUNTANT },
      { param: "doctor@example.com", role: ADMIN_ROLE.DOCTOR },
    ];
    for (const { param, role } of staff) {
      await AdminModel.findOrCreate({
        where: { param: param.toLowerCase() },
        defaults: {
          param: param.toLowerCase(),
          password: SEED_ADMIN_PASSWORD,
          role,
          factory: FACTORY.FACTORY_1,
        },
      });
    }
  }

  static async currentAdmin(context: TContext): Promise<AdminModel> {
    const { id } = context;
    return await this.findIdCheck(id);
  }

  static async updateAdmin(
    doc: Partial<TAdmin> & { id: string },
    context: TContext,
  ): Promise<AdminModel> {
    const { id, param, password, role, factory } = doc;
    const admin = await this.findIdCheck(id);
    const own = this.scopeFactory(context);
    if (own && admin.factory !== own) throw new Error("admin not found");
    admin.factory = this._resolveFactory(
      context,
      role ?? admin.role,
      factory ?? admin.factory,
    );
    // Login matches on the lowercased param — store it the same way.
    if (param?.trim()) admin.param = param.trim().toLowerCase();
    if (password) admin.password = password;
    if (role) admin.role = role;

    return await admin.save();
  }

  static async deleteAdmin(
    doc: { id: string },
    context: TContext,
  ): Promise<void> {
    const { id } = doc;
    if (id === context.id) throw new Error("Cannot delete your own account");
    const admin = await this.findIdCheck(id);
    await admin.destroy();
  }
}
