import { DataTypes, Model, Sequelize } from "sequelize";
import {
  PAYMENT_STATUS,
  TSalesTransaction,
} from "../../types/sales/sales-transaction.type";
import { CustomerModel } from "../customer/customer.model";
import { SalesLineItemModel } from "./sales-line-item.model";
import { SalesInstallmentModel } from "./sales-installment.model";
import { AdminModel } from "../user/admin.model";
import { ShipmentModel } from "../shipment/shipment.model";

export class SalesTransactionModel
  extends Model
  implements TSalesTransaction
{
  public id!: string;
  public transactionCode!: string;
  public customerId!: string;
  public shipmentId!: string | null;
  public totalWeightKg!: number;
  public amount!: number | null;
  public paymentStatus!: PAYMENT_STATUS;
  public transactionDate!: Date;
  public paidAt!: Date | null;
  public createdById!: string;
  public notes!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public customer?: CustomerModel;
  public shipment?: ShipmentModel;
  public lineItems?: SalesLineItemModel[];
  public installments?: SalesInstallmentModel[];
  public createdBy?: AdminModel;

  static associate(): void {
    this.belongsTo(CustomerModel, {
      as: "customer",
      foreignKey: { name: "customerId", allowNull: false },
    });
    this.belongsTo(ShipmentModel, {
      as: "shipment",
      foreignKey: { name: "shipmentId", allowNull: true },
    });
    this.belongsTo(AdminModel, {
      as: "createdBy",
      foreignKey: { name: "createdById", allowNull: false },
    });
    this.hasMany(SalesLineItemModel, {
      as: "lineItems",
      foreignKey: { name: "salesTransactionId", allowNull: false },
    });
    this.hasMany(SalesInstallmentModel, {
      as: "installments",
      foreignKey: { name: "salesTransactionId", allowNull: false },
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
      // Nullable — auto-created invoices from a delivered-but-unpriced
      // shipment start with no amount until SalesTransactionController.
      // setAmount fills one in.
      amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
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
        // One invoice per shipment. Postgres unique indexes allow multiple
        // NULLs, so manually-created transactions (shipmentId null) don't
        // collide with each other.
        { fields: ["shipment_id"], unique: true },
      ],
    },
  );
};
