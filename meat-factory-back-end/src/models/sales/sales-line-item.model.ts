import { DataTypes, Model, Sequelize } from "sequelize";
import {
  PRODUCT_TYPE,
  TSalesLineItem,
} from "../../types/sales/sales-transaction.type";
import {
  ANIMAL_TYPE,
  BYPRODUCT_TYPE,
} from "../../types/livestock/registration.type";
import { SalesTransactionModel } from "./sales-transaction.model";

export class SalesLineItemModel extends Model implements TSalesLineItem {
  public id!: string;
  public salesTransactionId!: string;
  public productType!: PRODUCT_TYPE;
  public animalType!: ANIMAL_TYPE | null;
  public byproductType!: BYPRODUCT_TYPE | null;
  public quantityKg!: number;
  public unitPrice!: number;
  public lineAmount!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public salesTransaction?: SalesTransactionModel;

  static associate(): void {
    this.belongsTo(SalesTransactionModel, {
      as: "salesTransaction",
      foreignKey: { name: "salesTransactionId", allowNull: false },
    });
  }
}

export const createSalesLineItemModel = (sequelize: Sequelize) => {
  SalesLineItemModel.init(
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
      animalType: {
        type: DataTypes.ENUM(...Object.values(ANIMAL_TYPE)),
        allowNull: true,
        defaultValue: null,
      },
      byproductType: {
        type: DataTypes.ENUM(...Object.values(BYPRODUCT_TYPE)),
        allowNull: true,
        defaultValue: null,
      },
      quantityKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      lineAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
    },
    {
      modelName: "SalesLineItemModel",
      tableName: "SalesLineItems",
      timestamps: true,
      sequelize,
      indexes: [
        { fields: ["salesTransactionId"] },
        { fields: ["productType", "animalType"] },
        { fields: ["productType", "byproductType"] },
      ],
    },
  );
};
