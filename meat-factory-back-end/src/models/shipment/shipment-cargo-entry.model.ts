import { DataTypes, Model, Sequelize } from "sequelize";
import { TShipmentCargoEntry } from "../../types/shipment/shipment-cargo-entry.type";
import { ShipmentModel } from "./shipment.model";
import { AdminModel } from "../user/admin.model";

export class ShipmentCargoEntryModel
  extends Model
  implements TShipmentCargoEntry
{
  public id!: string;
  public shipmentId!: string;
  public productLabel!: string;
  public pieceCount!: number | null;
  public grossKg!: number | null;
  public tareKg!: number | null;
  public weightKg!: number;
  // Buyer-side price set AT LOADING. Independent from the herder weighing
  // price; lets "load now, price later" work — nullable until set.
  public pricePerKg!: number | null;
  public sequenceNo!: number;
  public createdById!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  public shipment?: ShipmentModel;
  public createdBy?: AdminModel;

  static associate(): void {
    this.belongsTo(ShipmentModel, {
      as: "shipment",
      foreignKey: { name: "shipmentId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "createdBy",
      foreignKey: { name: "createdById", allowNull: false },
    });
  }
}

export const createShipmentCargoEntryModel = (sequelize: Sequelize) => {
  ShipmentCargoEntryModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      productLabel: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pieceCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      grossKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      tareKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      weightKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      pricePerKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      sequenceNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: "ShipmentCargoEntryModel",
      tableName: "ShipmentCargoEntries",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["shipment_id"] },
        { fields: ["shipment_id", "sequence_no"], unique: true },
      ],
    },
  );
};
