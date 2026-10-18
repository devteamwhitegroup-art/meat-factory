import { RoleModel } from "../../models/user/role.model";
import { AdminModel } from "../../models/user/admin.model";
import {
  ALL_PERMISSIONS,
  PERMISSION,
  PERMISSION_GROUPS,
  TPermissionGroup,
} from "../../types/user/permission.type";
import { TCreateRole, TUpdateRole } from "../../types/user/role.type";
import { TContext } from "../../types/global/global.type";
import sequelize from "../../config/db-connection";
import { findOrThrow } from "../../utils";

const P = PERMISSION;

// The roles the client runs today, created once on an empty table. Admin
// edits/deletes them freely afterwards (except the system role).
const DEFAULT_ROLES: Array<Omit<TCreateRole, "crossFactory"> & {
  crossFactory: boolean;
  isSystem?: boolean;
}> = [
  { name: "Админ", permissions: [...ALL_PERMISSIONS], crossFactory: true, isSystem: true },
  {
    name: "Нярав",
    crossFactory: false,
    permissions: [
      P.REGISTRATION_CREATE, P.REGISTRATION_WEIGH, P.REGISTRATION_VERIFY,
      P.MEDICAL_NUMBER_ENTER, P.MEDICAL_NUMBER_CHECK, P.SETTLEMENT_CREATE,
      P.HERDER_EDIT, P.SHIPMENT_VIEW, P.SHIPMENT_MANAGE, P.INVENTORY_VIEW,
      P.INVENTORY_ADJUST, P.BYPRODUCT_TRANSFER, P.BYPRODUCT_PROCESS,
    ],
  },
  {
    // Finance spans every factory.
    name: "Нягтлан",
    crossFactory: true,
    permissions: [
      P.SETTLEMENT_CREATE, P.SETTLEMENT_PAY, P.CUSTOMER_MANAGE, P.SALES_MANAGE,
      P.SHIPMENT_VIEW, P.SHIPMENT_SALES, P.DASHBOARD_VIEW,
    ],
  },
  {
    name: "Эмч",
    crossFactory: false,
    permissions: [P.REGISTRATION_CREATE, P.MEDICAL_NUMBER_ENTER, P.MEDICAL_NUMBER_CHECK],
  },
];

export class RoleController {
  static findIdCheck(id: string): Promise<RoleModel> {
    return findOrThrow(RoleModel, id, "Эрх олдсонгүй");
  }

  static catalog(): TPermissionGroup[] {
    return PERMISSION_GROUPS;
  }

  static async seedDefaults(): Promise<void> {
    if ((await RoleModel.count()) > 0) return;
    await RoleModel.bulkCreate(DEFAULT_ROLES);
  }

  // The undeletable owner role (seedAdmin + lockout guard).
  static async systemRole(): Promise<RoleModel> {
    const role = await RoleModel.findOne({ where: { isSystem: true } });
    if (!role) throw new Error("Системийн админ эрх алга — /seed/admin");
    return role;
  }

  static async byName(name: string): Promise<RoleModel> {
    const role = await RoleModel.findOne({ where: { name } });
    if (!role) throw new Error(`Эрх олдсонгүй: ${name}`);
    return role;
  }

  // ponytail: unpaginated — a handful of roles.
  static list(): Promise<RoleModel[]> {
    return RoleModel.findAll({ order: [["createdAt", "ASC"]] });
  }

  private static _permissions(raw: PERMISSION[] | null | undefined): PERMISSION[] {
    const set = new Set(raw ?? []);
    for (const p of set)
      if (!ALL_PERMISSIONS.includes(p)) throw new Error(`Буруу эрх: ${p}`);
    return Array.from(set);
  }

  static async create(doc: TCreateRole): Promise<RoleModel> {
    const name = doc.name?.trim();
    if (!name) throw new Error("Эрхийн нэр оруулна уу");
    if (await RoleModel.findOne({ where: { name } }))
      throw new Error("Энэ нэртэй эрх байна");
    return RoleModel.create({
      name,
      permissions: this._permissions(doc.permissions),
      crossFactory: !!doc.crossFactory,
    });
  }

  static async update(doc: TUpdateRole, context: TContext): Promise<RoleModel> {
    const role = await this.findIdCheck(doc.id);
    if (doc.name != null) {
      const name = doc.name.trim();
      if (!name) throw new Error("Эрхийн нэр оруулна уу");
      const dupe = await RoleModel.findOne({ where: { name } });
      if (dupe && dupe.id !== role.id) throw new Error("Энэ нэртэй эрх байна");
      role.name = name;
    }
    if (doc.permissions != null) {
      if (role.isSystem)
        throw new Error("Системийн админ эрхийн зөвшөөрлийг өөрчлөх боломжгүй");
      role.permissions = this._permissions(doc.permissions);
    }
    const flip =
      doc.crossFactory != null && doc.crossFactory !== role.crossFactory;
    if (flip) {
      if (role.isSystem)
        throw new Error("Системийн админ эрх бүх үйлдвэрт хамаарна");
      // A factory-bound actor must not widen anyone's reach.
      if (!context.crossFactory)
        throw new Error("Хамрах хүрээг зөвхөн бүх үйлдвэрийн админ өөрчилнө");
      // Narrowing would leave the role's staff with no factory.
      if (!doc.crossFactory && (await AdminModel.count({ where: { roleId: role.id } })) > 0)
        throw new Error(
          "Энэ эрхтэй ажилтан байгаа тул нэг үйлдвэрт шилжүүлэх боломжгүй",
        );
      role.crossFactory = !!doc.crossFactory;
    }
    return sequelize.transaction(async (transaction) => {
      // Cross-factory staff carry no factory.
      if (flip && role.crossFactory)
        await AdminModel.update(
          { factory: null },
          { where: { roleId: role.id }, transaction },
        );
      return role.save({ transaction });
    });
  }

  static async delete(id: string): Promise<void> {
    const role = await this.findIdCheck(id);
    if (role.isSystem) throw new Error("Системийн админ эрхийг устгах боломжгүй");
    const used = await AdminModel.count({ where: { roleId: id } });
    if (used > 0)
      throw new Error(`${used} ажилтанд оноогдсон тул устгах боломжгүй`);
    await role.destroy();
  }
}
