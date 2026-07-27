import { DataTypes, Model, Sequelize } from "sequelize";
import { TSettings } from "../../types/settings/settings.type";

// Singleton row — there is exactly one Settings record in the DB. The
// SettingsController.get() helper auto-creates it on first access with safe
// defaults, so it always exists by the time anyone reads it.
export class SettingsModel extends Model implements TSettings {
  public id!: string;
  public meatCapacityKg!: number;
  public exportAlertThresholdKg!: number;
  public domesticAlertThresholdKg!: number;
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
      exportAlertThresholdKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      domesticAlertThresholdKg: {
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
