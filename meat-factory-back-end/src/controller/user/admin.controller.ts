import config from "../../config";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHmac } from "node:crypto";

import { Attributes, Model, WhereOptions } from "sequelize";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { AdminModel } from "../../models/user/admin.model";
import { RoleModel } from "../../models/user/role.model";
import {
  TAdminLoginInput,
  TCreateAdmin,
  TUpdateAdmin,
} from "../../types/user/admin.type";
import { PERMISSION } from "../../types/user/permission.type";
import { RoleController } from "./role.controller";
import { FactoryController } from "../factory/factory.controller";
import { findOrThrow } from "../../utils";

const { ADMIN_JWT_TOKEN_SALT, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = config;

// Every staff read carries its role — the FE shows role name + permissions.
const ADMIN_INCLUDE = [{ model: RoleModel, as: "role" }];

export class AdminController {
  static findIdCheck(id: string): Promise<AdminModel> {
    return findOrThrow(AdminModel, id, "admin not found", {
      include: ADMIN_INCLUDE,
    });
  }

  static async getExistingAdmin<M extends Model>(
    where: WhereOptions<Attributes<M>>,
    withPassword: boolean = false,
  ): Promise<AdminModel> {
    const admin = await (withPassword
      ? AdminModel.scope("withPassword")
      : AdminModel
    ).findOne({ where, include: ADMIN_INCLUDE });
    if (!admin) throw new Error("Admin not found");
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

  // The token only identifies the account; permissions/factory are read live
  // from the DB on every request (getTokenInfo), so role edits apply at once.
  static async generateJwt(doc: Pick<TContext, "id">): Promise<string> {
    return jwt.sign(doc, ADMIN_JWT_TOKEN_SALT);
  }

  static async _verifyJwt(token: string): Promise<Pick<TContext, "id">> {
    return jwt.verify(token, ADMIN_JWT_TOKEN_SALT) as Pick<TContext, "id">;
  }

  static async login(
    doc: TAdminLoginInput,
  ): Promise<{ admin: AdminModel; token: string }> {
    const { param, password } = doc;

    const admin = await this.getExistingAdmin<AdminModel>(
      { param: param.toLowerCase() },
      true,
    );
    await this._matchPassword(password, admin.password);
    const token = await this.generateJwt({ id: admin.id });

    return { admin, token };
  }

  static async getTokenInfo(token: string): Promise<TContext | null> {
    if (!token) return null;
    const { id } = await this._verifyJwt(token);
    const admin = await this.findIdCheck(id);
    const role = admin.role;
    if (!role) throw new Error("Эрх оноогоогүй байна");
    return {
      id,
      permissions: role.permissions,
      crossFactory: role.crossFactory,
      factory: admin.factory,
    };
  }

  // ─── Permission guards (controllers re-check what the @auth directive
  // already enforced at the field, plus finer business rules) ─────────────

  static hasPermission(context: TContext, permission: PERMISSION): boolean {
    return context.permissions.includes(permission);
  }

  // Actor needs ANY of the listed permissions.
  static assertPermission(context: TContext, ...anyOf: PERMISSION[]): void {
    if (!context || !anyOf.some((p) => context.permissions.includes(p)))
      throw new Error("Энэ үйлдлийг хийх эрх хүрэхгүй байна");
  }

  // ─── Factory boundary ──────────────────────────────────────────────────

  // The actor's factory boundary: null = cross-factory role (every site).
  // Public — the per-factory data scoping in other controllers routes here.
  static scopeFactory(context: TContext): string | null {
    if (context.crossFactory) return null;
    if (!context.factory) throw new Error("Танд үйлдвэр оноогоогүй байна");
    return context.factory;
  }

  // List filter: staff → own factory; cross-factory → the one asked for, or all.
  static readFactory(
    context: TContext,
    requested?: string | null,
  ): string | null {
    const own = this.scopeFactory(context);
    if (own) return own;
    if (requested) FactoryController.get(requested);
    return requested ?? null;
  }

  // Create target: staff → own factory; cross-factory actors must name one.
  static writeFactory(context: TContext, requested?: string | null): string {
    const factory = this.readFactory(context, requested);
    if (!factory) throw new Error("Үйлдвэр сонгоно уу");
    FactoryController.assertActive(factory);
    return factory;
  }

  // Row guard: factory staff can't reach another factory's records.
  static assertFactory(context: TContext, factory: string): void {
    const own = this.scopeFactory(context);
    if (own && own !== factory) throw new Error("Олдсонгүй");
  }

  // Cross-factory roles carry no factory; every other role needs one. A
  // factory-bound actor can only grant factory roles, in their own factory.
  private static _resolveFactory(
    context: TContext,
    role: RoleModel,
    factory?: string | null,
  ): string | null {
    const own = this.scopeFactory(context);
    if (role.crossFactory) {
      if (own) throw new Error("Бүх үйлдвэрийн эрхийг зөвхөн админ онооно");
      return null;
    }
    const resolved = own ?? factory;
    if (!resolved) throw new Error("Энэ эрхэд үйлдвэр заавал сонгоно");
    FactoryController.get(resolved);
    return resolved;
  }

  // ─── Staff accounts ────────────────────────────────────────────────────

  // ponytail: unpaginated — staff accounts number in the tens.
  static async getAdmins(
    context: TContext,
  ): Promise<TPaginationGeneric<AdminModel>> {
    const factory = this.scopeFactory(context);
    return await AdminModel.findAndCountAll({
      where: factory ? { factory } : {},
      include: ADMIN_INCLUDE,
      order: [["createdAt", "ASC"]],
    });
  }

  static async createAdmin(
    doc: TCreateAdmin,
    context: TContext,
  ): Promise<AdminModel> {
    const { param, password, roleId } = doc;
    if (!param || !param.trim()) throw new Error("Нэвтрэх нэр оруулна уу");
    if (!password || !password.trim()) throw new Error("Нууц үг оруулна уу");
    if (!roleId) throw new Error("Эрх сонгоно уу");
    const role = await RoleController.findIdCheck(roleId);
    const factory = this._resolveFactory(context, role, doc.factory);
    // beforeCreate hook on the model hashes the password.
    const created = await AdminModel.create({
      param: param.trim().toLowerCase(),
      password,
      roleId: role.id,
      factory,
    });
    return this.findIdCheck(created.id);
  }

  static async seedAdmin(): Promise<void> {
    const role = await RoleController.systemRole();
    await AdminModel.findOrCreate({
      where: {
        param: SEED_ADMIN_EMAIL.toLowerCase(),
      },
      defaults: {
        param: SEED_ADMIN_EMAIL.toLowerCase(),
        password: SEED_ADMIN_PASSWORD,
        roleId: role.id,
      },
    });
  }

  // Dev-only: one account per default job role, at the first factory, for
  // testing the workflow end to end.
  static async seedStaff(): Promise<void> {
    const factory = FactoryController.all()[0];
    if (!factory) throw new Error("No factories configured");
    const staff: Array<{ param: string; role: string }> = [
      { param: "store@example.com", role: "Нярав" },
      { param: "accountant@example.com", role: "Нягтлан" },
      { param: "doctor@example.com", role: "Эмч" },
    ];
    for (const { param, role } of staff) {
      const r = await RoleController.byName(role);
      await AdminModel.findOrCreate({
        where: { param: param.toLowerCase() },
        defaults: {
          param: param.toLowerCase(),
          password: SEED_ADMIN_PASSWORD,
          roleId: r.id,
          factory: factory.code,
        },
      });
    }
  }

  static async currentAdmin(context: TContext): Promise<AdminModel> {
    return await this.findIdCheck(context.id);
  }

  static async updateAdmin(
    doc: TUpdateAdmin,
    context: TContext,
  ): Promise<AdminModel> {
    const { id, param, password, roleId, factory } = doc;
    const admin = await this.findIdCheck(id);
    const own = this.scopeFactory(context);
    if (own && admin.factory !== own) throw new Error("admin not found");
    const role = roleId
      ? await RoleController.findIdCheck(roleId)
      : (admin.role as RoleModel);
    admin.factory = this._resolveFactory(
      context,
      role,
      factory ?? admin.factory,
    );
    // Login matches on the lowercased param — store it the same way.
    if (param?.trim()) admin.param = param.trim().toLowerCase();
    if (password) admin.password = password;
    admin.roleId = role.id;

    await admin.save();
    return this.findIdCheck(id);
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
