import { DataTypes, Model, Sequelize } from "sequelize";
import { TByproductProcessingLine } from "../../types/inventory/byproduct-processing.type";
import { ByproductProcessingModel } from "./byproduct-processing.model";
import { ByproductConstantModel } from "../livestock/byproduct-constant.model";

// One organ of a disassembly batch: norm-expected vs weighed kg. `name` is
// snapshotted so renaming/removing the norm keeps the history readable.
export class ByproductProcessingLineModel
  extends Model
  implements TByproductProcessingLine
{
  public id!: string;
  public processingId!: string;
  public constantId!: string | null;
  public name!: string;
  public expectedCount!: number;
  public expectedKg!: number | null;
  public actualKg!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public processing?: ByproductProcessingModel;

  static associate(): void {
    this.belongsTo(ByproductProcessingModel, {
      as: "processing",
      foreignKey: { name: "processingId", allowNull: false },
    });
    this.belongsTo(ByproductConstantModel, {
      as: "constant",
      foreignKey: { name: "constantId", allowNull: true },
      onDelete: "SET NULL",
    });
  }
}

export const createByproductProcessingLineModel = (sequelize: Sequelize) => {
  ByproductProcessingLineModel.init(
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
      },
      expectedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      expectedKg: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
      },
      actualKg: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
    },
    {
      modelName: "ByproductProcessingLineModel",
      tableName: "ByproductProcessingLines",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["processing_id"] }, { fields: ["name"] }],
    },
  );
};
