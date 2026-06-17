import { DataTypes, Model, Sequelize } from "sequelize";
import { TMonthlyBudget } from "../../types/dashboard/monthly-budget.type";

export class MonthlyBudgetModel extends Model implements TMonthlyBudget {
  public id!: string;
  public year!: number;
  public month!: number;
  public amountMnt!: number;
  public notes!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(): void {
    // standalone
  }
}

export const createMonthlyBudgetModel = (sequelize: Sequelize) => {
  MonthlyBudgetModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amountMnt: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "MonthlyBudgetModel",
      tableName: "MonthlyBudgets",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["year", "month"], unique: true }],
    },
  );
};
