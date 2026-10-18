import { DataTypes, Model, Sequelize } from "sequelize";
import { TSalesExpense } from "../../types/sales/sales-expense.type";
import { SalesTransactionModel } from "./sales-transaction.model";
import { AdminModel } from "../user/admin.model";

export class SalesExpenseModel extends Model implements TSalesExpense {
  public id!: string;
  public salesTransactionId!: string;
  public name!: string;
  public amountMnt!: number;
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

export const createSalesExpenseModel = (sequelize: Sequelize) => {
  SalesExpenseModel.init(
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
      amountMnt: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      modelName: "SalesExpenseModel",
      tableName: "SalesExpenses",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["sales_transaction_id"] }],
    },
  );
};
