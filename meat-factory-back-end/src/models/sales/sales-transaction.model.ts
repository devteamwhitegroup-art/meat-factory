import { DataTypes, Model, Sequelize } from "sequelize";
import {
  PAYMENT_STATUS,
  TSalesTransaction,
} from "../../types/sales/sales-transaction.type";
import { CustomerModel } from "../customer/customer.model";
import { SalesLineItemModel } from "./sales-line-item.model";
import { ShipmentModel } from "../shipment/shipment.model";
import { AdminModel } from "../user/admin.model";

export class SalesTransactionModel
  extends Model
  implements TSalesTransaction
{
  public id!: string;
  public transactionCode!: string;
  public customerId!: string;
  public totalWeightKg!: number;
  public amount!: number;
  public paymentStatus!: PAYMENT_STATUS;
  public transactionDate!: Date;
  public paidAt!: Date | null;
  public createdById!: string;
  public notes!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public customer?: CustomerModel;
  public lineItems?: SalesLineItemModel[];
  public shipment?: ShipmentModel;
  public createdBy?: AdminModel;

  static associate(): void {
    this.belongsTo(CustomerModel, {
      as: "customer",
      foreignKey: { name: "customerId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "createdBy",
      foreignKey: { name: "createdById", allowNull: false },
    });
    this.hasMany(SalesLineItemModel, {
      as: "lineItems",
      foreignKey: { name: "salesTransactionId", allowNull: false },
    });
    this.hasOne(ShipmentModel, {
      as: "shipment",
      foreignKey: { name: "salesTransactionId", allowNull: true },
    });
  }
}

export const createSalesTransactionModel = (sequelize: Sequelize) => {
  SalesTransactionModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      transactionCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      totalWeightKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      paymentStatus: {
        type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
        allowNull: false,
        defaultValue: PAYMENT_STATUS.PENDING,
      },
      transactionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      paidAt: {
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
      modelName: "SalesTransactionModel",
      tableName: "SalesTransactions",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["transaction_code"], unique: true },
        { fields: ["customer_id"] },
        { fields: ["payment_status"] },
        { fields: ["transaction_date"] },
      ],
    },
  );
};
