import { DataTypes, Model, Sequelize } from "sequelize";
import {
  CHANGE_REQUEST_STATUS,
  TRegistrationChangeRequest,
  TRegistrationChanges,
} from "../../types/livestock/registration.type";
import { RegistrationModel } from "./registration.model";
import { AdminModel } from "../user/admin.model";

// A staff member's request to fix an intake after its registration day has
// passed. Admin approves (changes applied) or rejects.
export class RegistrationChangeRequestModel
  extends Model
  implements TRegistrationChangeRequest
{
  public id!: string;
  public registrationId!: string;
  public requestedById!: string;
  public changes!: TRegistrationChanges;
  public reason!: string;
  public status!: CHANGE_REQUEST_STATUS;
  public reviewedById!: string | null;
  public reviewedAt!: Date | null;
  public reviewNote!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public requestedBy?: AdminModel;
  public reviewedBy?: AdminModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "requestedBy",
      foreignKey: { name: "requestedById", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "reviewedBy",
      foreignKey: { name: "reviewedById", allowNull: true },
    });
  }
}

export const createRegistrationChangeRequestModel = (sequelize: Sequelize) => {
  RegistrationChangeRequestModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      changes: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(CHANGE_REQUEST_STATUS)),
        allowNull: false,
        defaultValue: CHANGE_REQUEST_STATUS.PENDING,
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      reviewNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "RegistrationChangeRequestModel",
      tableName: "RegistrationChangeRequests",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["registration_id"] }, { fields: ["status"] }],
    },
  );
};
