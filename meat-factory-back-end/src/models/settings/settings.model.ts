import { DataTypes, Model, Sequelize } from "sequelize";
import { TSettings } from "../../types/settings/settings.type";

// Singleton row — there is exactly one Settings record in the DB. The
// SettingsController.get() helper auto-creates it on first access with safe
// defaults, so it always exists by the time anyone reads it.
export class SettingsModel extends Model implements TSettings {
  public id!: string;
  public meatCapacityKg!: number;
  public meatAlertThresholdKg!: number;
  public cargoCapacityKg!: number;
  public lastAlertedAt!: Date | null;
  public lastAlertedStockKg!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(): void {}
}

export const createSettingsModel = (sequelize: Sequelize) => {
  SettingsModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      meatCapacityKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      meatAlertThresholdKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      cargoCapacityKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      lastAlertedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastAlertedStockKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      modelName: "SettingsModel",
      tableName: "Settings",
      timestamps: true,
      underscored: true,
      sequelize,
    },
  );
};
