import { DataTypes, Model, Sequelize } from "sequelize";
import { TInventoryItem } from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { InventoryMovementModel } from "./inventory-movement.model";
import { AnimalModel } from "../livestock/animal.model";

export class InventoryItemModel extends Model implements TInventoryItem {
  public id!: string;
  public sku!: string;
  public productType!: PRODUCT_TYPE;
  // Animal catalogue FK for MEAT rows. Null for byproducts. FK (not name) so
  // a catalogue rename never desyncs stock, and isExport is a join away.
  public animalId!: string | null;
  public byproductName!: string | null;
  public quantityKg!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public movements?: InventoryMovementModel[];
  public animal?: AnimalModel;

  static associate(): void {
    this.hasMany(InventoryMovementModel, {
      as: "movements",
      foreignKey: { name: "inventoryItemId", allowNull: false },
    });
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: true },
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
        { fields: ["animal_id"] },
      ],
    },
  );
};
