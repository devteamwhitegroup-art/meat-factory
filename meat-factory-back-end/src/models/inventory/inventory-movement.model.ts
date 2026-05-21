import { DataTypes, Model, Sequelize } from "sequelize";
import {
  MOVEMENT_SOURCE,
  MOVEMENT_TYPE,
  TInventoryMovement,
} from "../../types/inventory/inventory.type";
import { InventoryItemModel } from "./inventory-item.model";
import { ShipmentModel } from "../shipment/shipment.model";

export class InventoryMovementModel
  extends Model
  implements TInventoryMovement
{
  public id!: string;
  public inventoryItemId!: string;
  public movementType!: MOVEMENT_TYPE;
  public source!: MOVEMENT_SOURCE;
  public quantityKg!: number;
  public balanceAfterKg!: number;
  public sourceRegistrationId!: string | null;
  public sourceShipmentId!: string | null;
  public createdById!: string | null;
  public notes!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public item?: InventoryItemModel;
  public shipment?: ShipmentModel;

  static associate(): void {
    this.belongsTo(InventoryItemModel, {
      as: "item",
      foreignKey: { name: "inventoryItemId", allowNull: false },
    });
    this.belongsTo(ShipmentModel, {
      as: "shipment",
      foreignKey: { name: "sourceShipmentId", allowNull: true },
    });
  }
}

export const createInventoryMovementModel = (sequelize: Sequelize) => {
  InventoryMovementModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      movementType: {
        type: DataTypes.ENUM(...Object.values(MOVEMENT_TYPE)),
        allowNull: false,
      },
      source: {
        type: DataTypes.ENUM(...Object.values(MOVEMENT_SOURCE)),
        allowNull: false,
      },
      quantityKg: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      balanceAfterKg: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      // Soft reference to a livestock Registration (no FK, no association)
      // so the inventory module never imports the livestock module.
      sourceRegistrationId: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "InventoryMovementModel",
      tableName: "InventoryMovements",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["inventory_item_id"] },
        { fields: ["movement_type"] },
        { fields: ["source"] },
        { fields: ["source_registration_id"] },
        { fields: ["source_shipment_id"] },
      ],
    },
  );
};
