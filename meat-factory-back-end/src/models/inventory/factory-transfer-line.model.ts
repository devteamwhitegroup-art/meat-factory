import { DataTypes, Model, Sequelize } from "sequelize";
import { TFactoryTransferLine } from "../../types/inventory/factory-transfer.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { AnimalModel } from "../livestock/animal.model";

export class FactoryTransferLineModel
  extends Model
  implements TFactoryTransferLine
{
  public id!: string;
  public transferId!: string;
  public productType!: PRODUCT_TYPE;
  public animalId!: string | null;
  public byproductName!: string | null;
  public quantityKg!: number;
  public quantityCount!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public animal?: AnimalModel;

  static associate(): void {
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: true },
    });
  }
}

export const createFactoryTransferLineModel = (sequelize: Sequelize) => {
  FactoryTransferLineModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      productType: {
        type: DataTypes.ENUM(...Object.values(PRODUCT_TYPE)),
        allowNull: false,
      },
      byproductName: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      quantityKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      quantityCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      modelName: "FactoryTransferLineModel",
      tableName: "FactoryTransferLines",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["transfer_id"] }],
    },
  );
};
