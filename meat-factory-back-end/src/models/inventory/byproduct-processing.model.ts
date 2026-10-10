import { DataTypes, Model, Sequelize } from "sequelize";
import { TByproductProcessing } from "../../types/inventory/byproduct-processing.type";
import { FACTORY } from "../../types/user/admin.type";
import { ByproductProcessingLineModel } from "./byproduct-processing-line.model";
import { ByproductWrapperModel } from "../livestock/byproduct-wrapper.model";
import { AdminModel } from "../user/admin.model";

export class ByproductProcessingModel
  extends Model
  implements TByproductProcessing
{
  public id!: string;
  public code!: string;
  public factory!: FACTORY;
  public wrapperId!: string;
  public bundleCount!: number;
  public createdById!: string;
  public notes!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public lines?: ByproductProcessingLineModel[];
  public wrapper?: ByproductWrapperModel;
  public createdBy?: AdminModel;

  static associate(): void {
    this.hasMany(ByproductProcessingLineModel, {
      as: "lines",
      foreignKey: { name: "processingId", allowNull: false },
    });
    this.belongsTo(ByproductWrapperModel, {
      as: "wrapper",
      foreignKey: { name: "wrapperId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "createdBy",
      foreignKey: { name: "createdById", allowNull: false },
    });
  }
}

export const createByproductProcessingModel = (sequelize: Sequelize) => {
  ByproductProcessingModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      factory: {
        type: DataTypes.ENUM(...Object.values(FACTORY)),
        allowNull: false,
      },
      bundleCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "ByproductProcessingModel",
      tableName: "ByproductProcessings",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["code"], unique: true },
        { fields: ["factory"] },
        { fields: ["wrapper_id"] },
      ],
    },
  );
};
