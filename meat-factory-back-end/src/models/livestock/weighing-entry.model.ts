import { DataTypes, Model, Sequelize } from "sequelize";
import { TWeighingEntry } from "../../types/livestock/weighing-entry.type";
import { RegistrationModel } from "./registration.model";
import { AdminModel } from "../user/admin.model";
import { FileModel } from "../global/file.model";
import { AnimalModel } from "./animal.model";

export class WeighingEntryModel extends Model implements TWeighingEntry {
  public id!: string;
  public registrationId!: string;
  public animalId!: string;
  public weightKg!: number;
  public pricePerKg!: number | null;
  public sequenceNo!: number;
  public scaleOperatorId!: string;
  public photoFileId!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public animal?: AnimalModel;
  public scaleOperator?: AdminModel;
  public photo?: FileModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "scaleOperator",
      foreignKey: { name: "scaleOperatorId", allowNull: false },
    });
    this.belongsTo(FileModel, {
      as: "photo",
      foreignKey: { name: "photoFileId", allowNull: true },
    });
  }
}

export const createWeighingEntryModel = (sequelize: Sequelize) => {
  WeighingEntryModel.init(
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
      weightKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      pricePerKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
      },
      sequenceNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: "WeighingEntryModel",
      tableName: "WeighingEntries",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["registration_id"] },
        { fields: ["registration_id", "sequence_no"], unique: true },
        { fields: ["animal_id"] },
      ],
    },
  );
};
