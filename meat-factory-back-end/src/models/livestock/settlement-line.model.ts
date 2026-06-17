import { DataTypes, Model, Sequelize } from "sequelize";
import { TSettlementLine } from "../../types/livestock/settlement.type";
import { SettlementModel } from "./settlement.model";
import { AnimalModel } from "./animal.model";

export class SettlementLineModel extends Model implements TSettlementLine {
  public id!: string;
  public settlementId!: string;
  public animalId!: string;
  public receivedWeightKg!: number;
  public pricePerKg!: number;
  public meatAmount!: number;
  public byproductAmount!: number;
  public slaughterCost!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public settlement?: SettlementModel;
  public animal?: AnimalModel;

  static associate(): void {
    this.belongsTo(SettlementModel, {
      as: "settlement",
      foreignKey: { name: "settlementId", allowNull: false },
    });
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: false },
    });
  }
}

export const createSettlementLineModel = (sequelize: Sequelize) => {
  SettlementLineModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      animalId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      receivedWeightKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      pricePerKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      meatAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      byproductAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      slaughterCost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      modelName: "SettlementLineModel",
      tableName: "SettlementLines",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["settlement_id"] },
        { fields: ["settlement_id", "animal_id"], unique: true },
      ],
    },
  );
};
