import { DataTypes, Model, Sequelize } from "sequelize";
import { AnimalModel } from "../livestock/animal.model";
import { TShipmentSaleLine } from "../../types/shipment/shipment-sale-line.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { ShipmentModel } from "./shipment.model";
import { ShipmentSaleEntryModel } from "./shipment-sale-entry.model";

export class ShipmentSaleLineModel extends Model implements TShipmentSaleLine {
  public id!: string;
  public shipmentId!: string;
  public productType!: PRODUCT_TYPE;
  public animalId!: string | null;
  public byproductName!: string | null;
  public groupKey!: string;
  public totalWeightKg!: number;
  public pricePerKg!: number | null;
  public animal?: AnimalModel;
  public createdAt!: Date;
  public updatedAt!: Date;

  public shipment?: ShipmentModel;
  public entries?: ShipmentSaleEntryModel[];

  static associate(): void {
    this.belongsTo(ShipmentModel, {
      as: "shipment",
      foreignKey: { name: "shipmentId", allowNull: false },
    });
    this.hasMany(ShipmentSaleEntryModel, {
      as: "entries",
      foreignKey: { name: "saleLineId", allowNull: false },
    });
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: true },
    });
  }
}

export const createShipmentSaleLineModel = (sequelize: Sequelize) => {
  ShipmentSaleLineModel.init(
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
      animalId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      byproductName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      groupKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      totalWeightKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      pricePerKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "ShipmentSaleLineModel",
      tableName: "ShipmentSaleLines",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["shipment_id"] },
        { fields: ["shipment_id", "group_key"], unique: true },
      ],
    },
  );
};
