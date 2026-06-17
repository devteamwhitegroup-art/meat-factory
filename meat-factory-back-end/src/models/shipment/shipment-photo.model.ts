import { DataTypes, Model, Sequelize } from "sequelize";
import { TShipmentPhoto } from "../../types/shipment/shipment-photo.type";
import { ShipmentModel } from "./shipment.model";
import { FileModel } from "../global/file.model";

export class ShipmentPhotoModel extends Model implements TShipmentPhoto {
  public id!: string;
  public shipmentId!: string;
  public fileId!: string;
  public sequenceNo!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public shipment?: ShipmentModel;
  public file?: FileModel;

  static associate(): void {
    this.belongsTo(ShipmentModel, {
      as: "shipment",
      foreignKey: { name: "shipmentId", allowNull: false },
    });
    this.belongsTo(FileModel, {
      as: "file",
      foreignKey: { name: "fileId", allowNull: false },
    });
  }
}

export const createShipmentPhotoModel = (sequelize: Sequelize) => {
  ShipmentPhotoModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      sequenceNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: "ShipmentPhotoModel",
      tableName: "ShipmentPhotos",
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
