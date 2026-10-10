import { DataTypes, Model, Sequelize } from "sequelize";
import {
  MEDICAL_NUMBER_STATUS,
  TMedicalNumber,
} from "../../types/livestock/medical-number.type";
import { RegistrationModel } from "./registration.model";
import { AdminModel } from "../user/admin.model";

// One medical certificate number of a registration — a bulk intake often
// carries several. checkedBy/checkedAt record the vet's last status change.
export class MedicalNumberModel extends Model implements TMedicalNumber {
  public id!: string;
  public registrationId!: string;
  public number!: string;
  public status!: MEDICAL_NUMBER_STATUS;
  public checkedById!: string | null;
  public checkedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public checkedBy?: AdminModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "checkedBy",
      foreignKey: { name: "checkedById", allowNull: true },
    });
  }
}

export const createMedicalNumberModel = (sequelize: Sequelize) => {
  MedicalNumberModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      // 7 digits enforced in the controller; plain STRING so legacy numbers
      // copied from Registrations.medical_number still fit.
      number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(MEDICAL_NUMBER_STATUS)),
        allowNull: false,
        defaultValue: MEDICAL_NUMBER_STATUS.PENDING,
      },
      checkedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "MedicalNumberModel",
      tableName: "MedicalNumbers",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["registration_id", "number"], unique: true },
        { fields: ["status"] },
        { fields: ["number"] },
      ],
    },
  );
};
