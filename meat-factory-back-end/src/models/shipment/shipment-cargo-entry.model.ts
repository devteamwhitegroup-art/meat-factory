import { DataTypes, Model, Sequelize } from "sequelize";
import { TShipmentCargoEntry } from "../../types/shipment/shipment-cargo-entry.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { ShipmentModel } from "./shipment.model";
import { AdminModel } from "../user/admin.model";

export class ShipmentCargoEntryModel
  extends Model
  implements TShipmentCargoEntry
{
  public id!: string;
  public shipmentId!: string;
  public productType!: PRODUCT_TYPE;
  // MEAT line: meat type (EXPORT ⇒ HORSE only). Null on byproduct/legacy rows.
  public animalType!: string | null;
  // BYPRODUCT line: free-form byproduct name (inventory key). Null on meat.
  public byproductName!: string | null;
  // Optional traceability link to the byproduct catalogue entry. Soft FK.
  public sourceConstantId!: string | null;
  public productLabel!: string;
  public pieceCount!: number | null;
  public grossKg!: number | null;
  public tareKg!: number | null;
  public weightKg!: number;
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
      productType: {
        type: DataTypes.ENUM(...Object.values(PRODUCT_TYPE)),
        allowNull: false,
        defaultValue: PRODUCT_TYPE.MEAT,
      },
      animalType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      byproductName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sourceConstantId: {
        type: DataTypes.UUID,
        allowNull: true,
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
