import { DataTypes, Model, Sequelize } from "sequelize";
import { TShipmentSaleEntry } from "../../types/shipment/shipment-sale-line.type";
import { ShipmentModel } from "./shipment.model";
import { ShipmentSaleLineModel } from "./shipment-sale-line.model";
import { AdminModel } from "../user/admin.model";

// Salesman's sales report line: kg of one product group sold at a price.
export class ShipmentSaleEntryModel
  extends Model
  implements TShipmentSaleEntry
{
  public id!: string;
  public shipmentId!: string;
  public saleLineId!: string;
  public weightKg!: number;
  public pricePerKg!: number;
  public createdById!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public saleLine?: ShipmentSaleLineModel;
  public createdBy?: AdminModel;

  static associate(): void {
    this.belongsTo(ShipmentModel, {
      as: "shipment",
      foreignKey: { name: "shipmentId", allowNull: false },
    });
    this.belongsTo(ShipmentSaleLineModel, {
      as: "saleLine",
      foreignKey: { name: "saleLineId", allowNull: false },
      onDelete: "CASCADE",
    });
    this.belongsTo(AdminModel, {
      as: "createdBy",
      foreignKey: { name: "createdById", allowNull: true },
    });
  }
}

export const createShipmentSaleEntryModel = (sequelize: Sequelize) => {
  ShipmentSaleEntryModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      weightKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      pricePerKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
    },
    {
      modelName: "ShipmentSaleEntryModel",
      tableName: "ShipmentSaleEntries",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["shipment_id"] }, { fields: ["sale_line_id"] }],
    },
  );
};
