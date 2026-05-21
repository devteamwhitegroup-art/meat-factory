import { DataTypes, Model, Sequelize } from "sequelize";
import { BYPRODUCT_TYPE } from "../../types/livestock/registration.type";
import { TByproductLog } from "../../types/livestock/byproduct-log.type";
import { RegistrationModel } from "./registration.model";
import { AdminModel } from "../user/admin.model";
import { FileModel } from "../global/file.model";

export class ByproductLogModel extends Model implements TByproductLog {
  public id!: string;
  public registrationId!: string;
  public byproductType!: BYPRODUCT_TYPE;
  public count!: number;
  public averageWeightKg!: number;
  public totalWeightKg!: number;
  public loggedById!: string;
  public photoFileId!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public loggedBy?: AdminModel;
  public photo?: FileModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "loggedBy",
      foreignKey: { name: "loggedById", allowNull: false },
    });
    this.belongsTo(FileModel, {
      as: "photo",
      foreignKey: { name: "photoFileId", allowNull: true },
    });
  }
}

export const createByproductLogModel = (sequelize: Sequelize) => {
  ByproductLogModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      byproductType: {
        type: DataTypes.ENUM(...Object.values(BYPRODUCT_TYPE)),
        allowNull: false,
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      averageWeightKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      totalWeightKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
    },
    {
      modelName: "ByproductLogModel",
      tableName: "ByproductLogs",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["registration_id"] },
        { fields: ["registration_id", "byproduct_type"] },
      ],
    },
  );
};
