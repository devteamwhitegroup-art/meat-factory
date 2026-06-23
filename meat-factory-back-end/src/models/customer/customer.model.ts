import { DataTypes, Model, Sequelize } from "sequelize";
import { CUSTOMER_KIND, TCustomer } from "../../types/customer/customer.type";
import { SalesTransactionModel } from "../sales/sales-transaction.model";
import { ShipmentModel } from "../shipment/shipment.model";

export class CustomerModel extends Model implements TCustomer {
  public id!: string;
  public name!: string;
  public kind!: CUSTOMER_KIND;
  public contactPhone!: string | null;
  public address!: string | null;
  public bankAccount!: string | null;
  public registrationNumber!: string | null;
  public taxId!: string | null;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  public salesTransactions?: SalesTransactionModel[];
  public shipments?: ShipmentModel[];

  static associate(): void {
    this.hasMany(SalesTransactionModel, {
      as: "salesTransactions",
      foreignKey: { name: "customerId", allowNull: false },
    });
    this.hasMany(ShipmentModel, {
      as: "shipments",
      foreignKey: { name: "customerId", allowNull: true },
    });
  }
}

export const createCustomerModel = (sequelize: Sequelize) => {
  CustomerModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kind: {
        type: DataTypes.ENUM(...Object.values(CUSTOMER_KIND)),
        allowNull: false,
        defaultValue: CUSTOMER_KIND.LOCAL_BROKER,
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      bankAccount: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      registrationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      taxId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      modelName: "CustomerModel",
      tableName: "Customers",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["name"] },
        { fields: ["registration_number"] },
        { fields: ["is_active"] },
        { fields: ["kind"] },
      ],
    },
  );
};
