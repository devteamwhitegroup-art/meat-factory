import { DataTypes, Model, Sequelize } from "sequelize";
import {
  DOMESTIC_MARKET,
  SHIPMENT_CATEGORY,
  SHIPMENT_STATUS,
  TShipment,
} from "../../types/shipment/shipment.type";
import { CustomerModel } from "../customer/customer.model";
import { AdminModel } from "../user/admin.model";
import { FileModel } from "../global/file.model";
import { ShipmentCargoEntryModel } from "./shipment-cargo-entry.model";
import { ShipmentPhotoModel } from "./shipment-photo.model";
import { ShipmentSaleLineModel } from "./shipment-sale-line.model";

export class ShipmentModel extends Model implements TShipment {
  public id!: string;
  public shipmentCode!: string;
  public category!: SHIPMENT_CATEGORY;
  // Sub-market for DOMESTIC shipments (LOCAL / ULAANBAATAR); null for EXPORT.
  public domesticMarket!: DOMESTIC_MARKET | null;
  public customerId!: string | null;
  public weightKg!: number;
  // Lump-sum broker deal agreed at end of load. Nullable until set.
  public totalPrice!: number | null;
  public pricedAt!: Date | null;
  public status!: SHIPMENT_STATUS;
  public shippedAt!: Date | null;
  public loadedById!: string;
  // e.g. "УНО0223" — the truck identifier copied from the notebook.
  public vehiclePlate!: string | null;
  // Driver-side info captured at loading.
  public driverName!: string | null;
  public driverPhone!: string | null;
  // Per-day loading counter (the N in shipmentCode SHIP-YYYYMMDD-N), assigned
  // at create. Resets daily, so unique only together with the date — global
  // uniqueness is carried by shipmentCode. Not user-editable.
  public serialNumber!: number;
  public notes!: string | null;
  public photoFileId!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public customer?: CustomerModel;
  public loadedBy?: AdminModel;
  public photo?: FileModel;
  public cargoEntries?: ShipmentCargoEntryModel[];
  public photos?: ShipmentPhotoModel[];
  public saleLines?: ShipmentSaleLineModel[];

  static associate(): void {
    this.belongsTo(CustomerModel, {
      as: "customer",
      foreignKey: { name: "customerId", allowNull: true },
    });
    this.belongsTo(AdminModel, {
      as: "loadedBy",
      foreignKey: { name: "loadedById", allowNull: false },
    });
    this.belongsTo(FileModel, {
      as: "photo",
      foreignKey: { name: "photoFileId", allowNull: true },
    });
    this.hasMany(ShipmentCargoEntryModel, {
      as: "cargoEntries",
      foreignKey: { name: "shipmentId", allowNull: false },
    });
    this.hasMany(ShipmentPhotoModel, {
      as: "photos",
      foreignKey: { name: "shipmentId", allowNull: false },
    });
    this.hasMany(ShipmentSaleLineModel, {
      as: "saleLines",
      foreignKey: { name: "shipmentId", allowNull: false },
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
      category: {
        type: DataTypes.ENUM(...Object.values(SHIPMENT_CATEGORY)),
        allowNull: false,
        defaultValue: SHIPMENT_CATEGORY.DOMESTIC,
      },
      domesticMarket: {
        type: DataTypes.ENUM(...Object.values(DOMESTIC_MARKET)),
        allowNull: true,
        defaultValue: null,
      },
      weightKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalPrice: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
      },
      pricedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
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
      vehiclePlate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      driverName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      driverPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      serialNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["shipment_code"], unique: true },
        { fields: ["category"] },
        { fields: ["domestic_market"] },
        { fields: ["customer_id"] },
        { fields: ["status"] },
      ],
    },
  );
};
