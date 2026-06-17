import { DataTypes, Model, Sequelize } from "sequelize";
import { TInventoryItem } from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import {
  ANIMAL_TYPE,
  BYPRODUCT_TYPE,
} from "../../types/livestock/registration.type";
import { InventoryMovementModel } from "./inventory-movement.model";

export class InventoryItemModel extends Model implements TInventoryItem {
  public id!: string;
  public sku!: string;
  public productType!: PRODUCT_TYPE;
  public animalType!: ANIMAL_TYPE | null;
  public byproductType!: BYPRODUCT_TYPE | null;
  public byproductName!: string | null;
  public quantityKg!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public movements?: InventoryMovementModel[];

  static associate(): void {
    this.hasMany(InventoryMovementModel, {
      as: "movements",
      foreignKey: { name: "inventoryItemId", allowNull: false },
    });
  }
}

export const createInventoryItemModel = (sequelize: Sequelize) => {
  InventoryItemModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
      byproductName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quantityKg: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      modelName: "InventoryItemModel",
      tableName: "InventoryItems",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["sku"], unique: true },
        { fields: ["product_type"] },
      ],
    },
  );
};
