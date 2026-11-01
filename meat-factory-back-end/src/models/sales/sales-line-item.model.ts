import { DataTypes, Model, Sequelize } from "sequelize";
import { AnimalModel } from "../livestock/animal.model";
import {
  PRODUCT_TYPE,
  TSalesLineItem,
} from "../../types/sales/sales-transaction.type";
import { SalesTransactionModel } from "./sales-transaction.model";

export class SalesLineItemModel extends Model implements TSalesLineItem {
  public id!: string;
  public salesTransactionId!: string;
  public productType!: PRODUCT_TYPE;
  public animalId!: string | null;
  public byproductName!: string | null;
  public quantityKg!: number;
  public unitPrice!: number | null;
  public lineAmount!: number | null;
  public animal?: AnimalModel;
  public createdAt!: Date;
  public updatedAt!: Date;

  public salesTransaction?: SalesTransactionModel;

  static associate(): void {
    this.belongsTo(SalesTransactionModel, {
      as: "salesTransaction",
      foreignKey: { name: "salesTransactionId", allowNull: false },
    });
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: true },
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
      // No defaultValue on an FK column: sync({alter}) would emit
      // "SET DEFAULT NULL REFERENCES …" (invalid SQL, Sequelize 6 bug).
      animalId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      byproductName: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      quantityKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
      },
      lineAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "SalesLineItemModel",
      tableName: "SalesLineItems",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["sales_transaction_id"] },
        { fields: ["product_type", "animal_id"] },
        { fields: ["product_type", "byproduct_name"] },
      ],
    },
  );
};
