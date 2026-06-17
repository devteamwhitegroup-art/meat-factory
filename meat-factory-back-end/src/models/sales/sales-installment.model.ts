import { DataTypes, Model, Sequelize } from "sequelize";
import { TSalesInstallment } from "../../types/sales/sales-installment.type";
import { SalesTransactionModel } from "./sales-transaction.model";
import { AdminModel } from "../user/admin.model";

export class SalesInstallmentModel
  extends Model
  implements TSalesInstallment
{
  public id!: string;
  public salesTransactionId!: string;
  public amountMnt!: number;
  public paidAt!: Date;
  public notes!: string | null;
  public createdById!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  public salesTransaction?: SalesTransactionModel;
  public createdBy?: AdminModel;

  static associate(): void {
    this.belongsTo(SalesTransactionModel, {
      as: "salesTransaction",
      foreignKey: { name: "salesTransactionId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "createdBy",
      foreignKey: { name: "createdById", allowNull: false },
    });
  }
}

export const createSalesInstallmentModel = (sequelize: Sequelize) => {
  SalesInstallmentModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      amountMnt: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      modelName: "SalesInstallmentModel",
      tableName: "SalesInstallments",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["sales_transaction_id"] },
        { fields: ["paid_at"] },
      ],
    },
  );
};
