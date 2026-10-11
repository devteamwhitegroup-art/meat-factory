import { DataTypes, Model, Sequelize } from "sequelize";
import { PERMISSION } from "../../types/user/permission.type";
import { TRole } from "../../types/user/role.type";

export class RoleModel extends Model implements TRole {
  public id!: string;
  public name!: string;
  public permissions!: PERMISSION[];
  public crossFactory!: boolean;
  public isSystem!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(): void {}
}

export const createRoleModel = (sequelize: Sequelize) => {
  RoleModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      // PERMISSION keys; validated against the enum in the controller.
      permissions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      crossFactory: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      modelName: "RoleModel",
      tableName: "Roles",
      timestamps: true,
      underscored: true,
      sequelize,
    },
  );
};
