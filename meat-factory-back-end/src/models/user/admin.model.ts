import { DataTypes, Model, Sequelize } from 'sequelize';
import config from '../../config';
import bcrypt from 'bcrypt';
import { createHmac } from 'node:crypto';
import { ADMIN_ROLE, TAdmin } from '../../types/user/admin.type';

const { PASSWORD_HASH_SALT } = config;
const salt = bcrypt.genSaltSync(PASSWORD_HASH_SALT);

const _hashPassword = async (password: string) => {
  const hashPassword = createHmac('sha256', password).digest('hex');

  const bcryptPassword = await bcrypt.hash(hashPassword, salt);
  return bcryptPassword;
};

export class AdminModel extends Model implements TAdmin {
  public id!: string;
  public param!: string;
  public password!: string;
  public role!: ADMIN_ROLE;

  static associate(): void {}
}

export const createAdminModel = async (sequelize: Sequelize) => {
  AdminModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
      },
      param: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM,
        values: Object.values(ADMIN_ROLE),
        allowNull: false,
        defaultValue: ADMIN_ROLE.ADMIN
      }
    },
    {
      modelName: 'AdminModel',
      tableName: 'Admins',
      timestamps: true,
      underscored: true,
      sequelize,
      scopes: {
        withPassword: {
          attributes: {
            exclude: []
          }
        }
      },
      defaultScope: {
        attributes: {
          exclude: ['password']
        }
      }
    }
  );

  AdminModel.beforeCreate(async (admin) => {
    if (admin.password) {
      const hashedPassword = await _hashPassword(admin.password);
      admin.password = hashedPassword;
    }
  });

  AdminModel.beforeUpdate(async (admin) => {
    if (admin.changed('password')) {
      const hashedPassword = await _hashPassword(admin.password);
      admin.password = hashedPassword;
    }
  });
};
