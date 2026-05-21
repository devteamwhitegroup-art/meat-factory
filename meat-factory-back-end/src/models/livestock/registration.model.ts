import { DataTypes, Model, Sequelize } from "sequelize";
import {
  REGISTRATION_STATUS,
  TRegistration,
} from "../../types/livestock/registration.type";
import { HerderModel } from "./herder.model";
import { RegistrationAnimalLineModel } from "./registration-animal-line.model";
import { WeighingEntryModel } from "./weighing-entry.model";
import { ByproductLogModel } from "./byproduct-log.model";
import { VerificationModel } from "./verification.model";
import { SettlementModel } from "./settlement.model";
import { FileModel } from "../global/file.model";
import { AdminModel } from "../user/admin.model";

export class RegistrationModel extends Model implements TRegistration {
  public id!: string;
  public registrationNumber!: number;
  public herderId!: string;
  public vehicleNumber!: string;
  public stamp!: string | null;
  public photoFileId!: string | null;
  public intakeDate!: Date;
  public guardId!: string;
  public status!: REGISTRATION_STATUS;
  public createdAt!: Date;
  public updatedAt!: Date;

  public herder?: HerderModel;
  public photo?: FileModel;
  public guard?: AdminModel;
  public animalLines?: RegistrationAnimalLineModel[];
  public weighingEntries?: WeighingEntryModel[];
  public byproductLogs?: ByproductLogModel[];
  public verification?: VerificationModel;
  public settlement?: SettlementModel;

  static associate(): void {
    this.belongsTo(HerderModel, {
      as: "herder",
      foreignKey: { name: "herderId", allowNull: false },
    });
    this.belongsTo(FileModel, {
      as: "photo",
      foreignKey: { name: "photoFileId", allowNull: true },
    });
    this.belongsTo(AdminModel, {
      as: "guard",
      foreignKey: { name: "guardId", allowNull: false },
    });
    this.hasMany(RegistrationAnimalLineModel, {
      as: "animalLines",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.hasMany(WeighingEntryModel, {
      as: "weighingEntries",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.hasMany(ByproductLogModel, {
      as: "byproductLogs",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.hasOne(VerificationModel, {
      as: "verification",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.hasOne(SettlementModel, {
      as: "settlement",
      foreignKey: { name: "registrationId", allowNull: false },
    });
  }
}

export const createRegistrationModel = (sequelize: Sequelize) => {
  RegistrationModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      registrationNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      vehicleNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stamp: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      intakeDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(REGISTRATION_STATUS)),
        allowNull: false,
        defaultValue: REGISTRATION_STATUS.REGISTERED,
      },
    },
    {
      modelName: "RegistrationModel",
      tableName: "Registrations",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["registration_number"], unique: true },
        { fields: ["status"] },
        { fields: ["herder_id"] },
        { fields: ["intake_date"] },
      ],
    },
  );
};
