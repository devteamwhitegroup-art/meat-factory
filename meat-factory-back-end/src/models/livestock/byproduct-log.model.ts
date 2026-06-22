import { DataTypes, Model, Sequelize } from "sequelize";
import { TByproductLog } from "../../types/livestock/byproduct-log.type";
import { RegistrationModel } from "./registration.model";
import { AdminModel } from "../user/admin.model";
import { FileModel } from "../global/file.model";
import { AnimalModel } from "./animal.model";

// Free-form per-registration byproduct row. `name` is the canonical
// identifier; animalId joins back to the Animal config (nullable for the
// rare case the row isn't tied to an animal).
export class ByproductLogModel extends Model implements TByproductLog {
  public id!: string;
  public registrationId!: string;
  public name!: string | null;
  public animalId!: string | null;
  public canCoverSlaughterCost!: boolean | null;
  public count!: number;
  public averageWeightKg!: number | null;
  public totalWeightKg!: number | null;
  public loggedById!: string;
  public photoFileId!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public animal?: AnimalModel;
  public loggedBy?: AdminModel;
  public photo?: FileModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: true },
    });
    this.belongsTo(AdminModel, {
      as: "loggedBy",
      foreignKey: { name: "loggedById", allowNull: false },
    });
    this.belongsTo(FileModel, {
      as: "photo",
      foreignKey: { name: "photoFileId", allowNull: true },
    });
  }
}

export const createByproductLogModel = (sequelize: Sequelize) => {
  ByproductLogModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      animalId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      canCoverSlaughterCost: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      averageWeightKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      totalWeightKg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "ByproductLogModel",
      tableName: "ByproductLogs",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["registration_id"] }, { fields: ["animal_id"] }],
    },
  );
};
