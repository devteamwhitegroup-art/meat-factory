import { DataTypes, Model, Sequelize } from "sequelize";
import {
  SHIPMENT_STATUS,
  TShipment,
} from "../../types/shipment/shipment.type";
import { CustomerModel } from "../customer/customer.model";
import { SalesTransactionModel } from "../sales/sales-transaction.model";
import { AdminModel } from "../user/admin.model";
import { FileModel } from "../global/file.model";

export class ShipmentModel extends Model implements TShipment {
  public id!: string;
  public shipmentCode!: string;
  public customerId!: string | null;
  public salesTransactionId!: string | null;
  public weightKg!: number;
  public status!: SHIPMENT_STATUS;
  public shippedAt!: Date | null;
  public loadedById!: string;
  public notes!: string | null;
  public photoFileId!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public customer?: CustomerModel;
  public salesTransaction?: SalesTransactionModel;
  public loadedBy?: AdminModel;
  public photo?: FileModel;

  static associate(): void {
    this.belongsTo(CustomerModel, {
      as: "customer",
      foreignKey: { name: "customerId", allowNull: true },
    });
    this.belongsTo(SalesTransactionModel, {
      as: "salesTransaction",
      foreignKey: { name: "salesTransactionId", allowNull: true },
    });
    this.belongsTo(AdminModel, {
      as: "loadedBy",
      foreignKey: { name: "loadedById", allowNull: false },
    });
    this.belongsTo(FileModel, {
      as: "photo",
      foreignKey: { name: "photoFileId", allowNull: true },
    });
  }
}

export const createShipmentModel = (sequelize: Sequelize) => {
  ShipmentModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      shipmentCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      weightKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(SHIPMENT_STATUS)),
        allowNull: false,
        defaultValue: SHIPMENT_STATUS.PENDING,
      },
      shippedAt: {
        type: DataTypes.DATE,
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
      modelName: "ShipmentModel",
      tableName: "Shipments",
      timestamps: true,
      sequelize,
      indexes: [
        { fields: ["shipmentCode"], unique: true },
        { fields: ["customerId"] },
        { fields: ["salesTransactionId"] },
        { fields: ["status"] },
      ],
    },
  );
};
