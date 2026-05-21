import { DataTypes, Model, Sequelize } from "sequelize";
import { ANIMAL_TYPE } from "../../types/livestock/registration.type";
import { TSettlementLine } from "../../types/livestock/settlement.type";
import { SettlementModel } from "./settlement.model";

export class SettlementLineModel extends Model implements TSettlementLine {
  public id!: string;
  public settlementId!: string;
  public animalType!: ANIMAL_TYPE;
  public receivedWeightKg!: number;
  public pricePerKg!: number;
  public meatAmount!: number;
  public byproductAmount!: number;
  public slaughterCost!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public settlement?: SettlementModel;

  static associate(): void {
    this.belongsTo(SettlementModel, {
      as: "settlement",
      foreignKey: { name: "settlementId", allowNull: false },
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
      animalType: {
        type: DataTypes.ENUM(...Object.values(ANIMAL_TYPE)),
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
        { fields: ["settlement_id", "animal_type"], unique: true },
      ],
    },
  );
};
