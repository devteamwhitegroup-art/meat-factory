import { DataTypes, Model, Sequelize } from "sequelize";
import { TShipmentSaleLine } from "../../types/shipment/shipment-sale-line.type";
import { ANIMAL_TYPE } from "../../types/livestock/registration.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { ShipmentModel } from "./shipment.model";

export class ShipmentSaleLineModel extends Model implements TShipmentSaleLine {
  public id!: string;
  public shipmentId!: string;
  public productType!: PRODUCT_TYPE;
  public animalType!: ANIMAL_TYPE | null;
  public byproductName!: string | null;
  public groupKey!: string;
  public totalWeightKg!: number;
  public pricePerKg!: number | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public shipment?: ShipmentModel;

  static associate(): void {
    this.belongsTo(ShipmentModel, {
      as: "shipment",
      foreignKey: { name: "shipmentId", allowNull: false },
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
      animalType: {
        type: DataTypes.ENUM(...Object.values(ANIMAL_TYPE)),
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
