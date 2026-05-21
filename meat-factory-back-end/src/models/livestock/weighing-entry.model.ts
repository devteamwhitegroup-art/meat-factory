import { DataTypes, Model, Sequelize } from "sequelize";
import { ANIMAL_TYPE } from "../../types/livestock/registration.type";
import { TWeighingEntry } from "../../types/livestock/weighing-entry.type";
import { RegistrationModel } from "./registration.model";
import { AdminModel } from "../user/admin.model";
import { FileModel } from "../global/file.model";

export class WeighingEntryModel extends Model implements TWeighingEntry {
  public id!: string;
  public registrationId!: string;
  public animalType!: ANIMAL_TYPE;
  public weightKg!: number;
  public sequenceNo!: number;
  public scaleOperatorId!: string;
  public photoFileId!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public scaleOperator?: AdminModel;
  public photo?: FileModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
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
      animalType: {
        type: DataTypes.ENUM(...Object.values(ANIMAL_TYPE)),
        allowNull: false,
      },
      weightKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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
      sequelize,
      indexes: [
        { fields: ["registrationId"] },
        { fields: ["registrationId", "sequenceNo"], unique: true },
      ],
    },
  );
};
