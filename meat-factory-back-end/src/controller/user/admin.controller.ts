import config from '../../config';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHmac } from 'node:crypto';

import {
  Attributes,
  IncludeOptions,
  Model,
  Order,
  WhereOptions
} from 'sequelize';
import { TContext } from '../../types/global/global.type';
import { AdminModel } from '../../models/user/admin.model';
import {
  ADMIN_ROLE,
  TAdmin,
  TAdminLoginInput,
  TCreateAdmin
} from '../../types/user/admin.type';

const { ADMIN_JWT_TOKEN_SALT, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = config;

export class AdminController {
  static async findIdCheck(
    id: string,
    include?: Array<IncludeOptions>,
    order?: Order
  ): Promise<TAdmin & Model> {
    const admin = await AdminModel.findByPk(id, {
      include,
      order
    });
    if (!admin) {
      throw new Error('admin not found');
    }
    return admin;
  }

  static async getExistingAdmin<M extends Model>(
    where: WhereOptions<Attributes<M>>,
    withPassword: boolean = false
  ): Promise<AdminModel> {
    let admin: AdminModel | null = null;
    if (withPassword) {
      admin = await AdminModel.scope('withPassword').findOne({
        where
      });
    } else {
      admin = await AdminModel.findOne({
        where
      });
    }

    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin;
  }

  static async _matchPassword(password, adminPassword): Promise<void> {
    const match = await bcrypt.compare(
      createHmac('sha256', password).digest('hex'),
      adminPassword
    );
    if (!match) throw new Error('Password do not match');
  }

  static async generateJwt(doc: TContext): Promise<string> {
    return jwt.sign(doc, ADMIN_JWT_TOKEN_SALT);
  }

  static async _verifyJwt(token: string): Promise<TContext> {
    return jwt.verify(token, ADMIN_JWT_TOKEN_SALT) as TContext;
  }

  static async login(
    doc: TAdminLoginInput
  ): Promise<{ admin: TAdmin; token: string }> {
    const { param, password } = doc;

    const admin = await this.getExistingAdmin<AdminModel>(
      { param: param.toLowerCase() },
      true
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
    return { id, role: admin.role };
  }

  static async createAdmin(doc: TCreateAdmin): Promise<AdminModel> {
    const { param, password, role } = doc;
    if (!param || !param.trim()) throw new Error('param is required');
    if (!password || !password.trim()) throw new Error('password is required');
    if (role && !Object.values(ADMIN_ROLE).includes(role)) {
      throw new Error(
        `role must be one of: ${Object.values(ADMIN_ROLE).join(', ')}`
      );
    }
    // beforeCreate hook on the model hashes the password.
    return await AdminModel.create({
      param: param.trim().toLowerCase(),
      password,
      role: role ?? ADMIN_ROLE.ADMIN
    });
  }

  static async seedAdmin(): Promise<void> {
    await AdminModel.findOrCreate({
      where: {
        param: SEED_ADMIN_EMAIL.toLowerCase()
      },
      defaults: {
        param: SEED_ADMIN_EMAIL.toLowerCase(),
        password: SEED_ADMIN_PASSWORD,
        role: ADMIN_ROLE.SUPER_ADMIN
      }
    });
  }

  // Dev-only: seed one staff account per operational role for testing
  // the meat-factory workflow end to end.
  static async seedStaff(): Promise<void> {
    const staff: Array<{ param: string; role: ADMIN_ROLE }> = [
      { param: 'manager@example.com', role: ADMIN_ROLE.MANAGER },
      { param: 'guard@example.com', role: ADMIN_ROLE.GUARD },
      { param: 'scale@example.com', role: ADMIN_ROLE.SCALE },
      { param: 'store@example.com', role: ADMIN_ROLE.STOREKEEPER }
    ];
    for (const { param, role } of staff) {
      await AdminModel.findOrCreate({
        where: { param: param.toLowerCase() },
        defaults: {
          param: param.toLowerCase(),
          password: SEED_ADMIN_PASSWORD,
          role
        }
      });
    }
  }

  static async currentAdmin(context: TContext): Promise<AdminModel> {
    const { id } = context;
    return await this.findIdCheck(id);
  }

  static async updateAdmin(
    doc: Partial<TAdmin> & { id: string }
  ): Promise<AdminModel> {
    const { id, param, password, role } = doc;
    const admin = await this.findIdCheck(id);
    if (param) admin.param = param;
    if (password) admin.password = password;
    if (role) admin.role = role;

    return await admin.save();
  }

  static async deleteAdmin(doc: { id: string }): Promise<void> {
    const { id } = doc;
    const admin = await this.findIdCheck(id);
    await admin.destroy();
  }
}
