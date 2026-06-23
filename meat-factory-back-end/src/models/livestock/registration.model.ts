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
  // Human-readable code REG-YYYYMMDD-N (N = per-day counter), assigned at
  // create alongside the numeric registrationNumber. Nullable for legacy rows.
  public registrationCode!: string | null;
  public herderId!: string;
  public vehicleNumber!: string;
  public stamp!: string | null;
  public medicalNumber!: string | null;
  // Factory confirmation of the medical number — gates release of the held
  // settlement portion.
  public medicalNumberApproved!: boolean;
  public photoFileId!: string | null;
  public signatureFileId!: string | null;
  public stampFileId!: string | null;
  // Herder's agreement signature on the weighed slip — drawn (signature pad)
  // after they accept the price/cost, before VERIFIED. Distinct from the
  // intake signatureFileId.
  public agreementSignatureFileId!: string | null;
  public intakeDate!: Date;
  public guardId!: string;
  public status!: REGISTRATION_STATUS;
  // Pre-butchered intake — the herder delivers ready-cut meat instead of
  // live animals. When true, slaughter cost is treated as 0 in settlement
  // and the per-animal "cover slaughter from byproducts" toggle is hidden.
  public isPreButchered!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  public herder?: HerderModel;
  public photo?: FileModel;
  public signature?: FileModel;
  public stampImage?: FileModel;
  public agreementSignature?: FileModel;
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
    this.belongsTo(FileModel, {
      as: "signature",
      foreignKey: { name: "signatureFileId", allowNull: true },
    });
    this.belongsTo(FileModel, {
      as: "stampImage",
      foreignKey: { name: "stampFileId", allowNull: true },
    });
    this.belongsTo(FileModel, {
      as: "agreementSignature",
      foreignKey: { name: "agreementSignatureFileId", allowNull: true },
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
      registrationCode: {
        type: DataTypes.STRING,
        allowNull: true,
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
      medicalNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      medicalNumberApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      isPreButchered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
        { fields: ["registration_code"], unique: true },
        { fields: ["status"] },
        { fields: ["herder_id"] },
        { fields: ["intake_date"] },
      ],
    },
  );
};
