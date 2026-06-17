import { DataTypes, Model, Sequelize } from "sequelize";
import { TVerification } from "../../types/livestock/verification.type";
import { RegistrationModel } from "./registration.model";
import { AdminModel } from "../user/admin.model";
import { FileModel } from "../global/file.model";

// Single-signer verification: one authorised staff member (нярав / нягтлан /
// админ) confirms and signs. The earlier 2-signer fields (secondVerifierId /
// secondVerifiedAt / secondVerifier association) were removed since nothing
// ever wrote them after the model collapsed to a single signer.
export class VerificationModel extends Model implements TVerification {
  public id!: string;
  public registrationId!: string;
  public firstVerifierId!: string | null;
  public firstVerifiedAt!: Date | null;
  public notes!: string | null;
  public photoFileId!: string | null;
  public slaughterCoveredByByproduct!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public firstVerifier?: AdminModel;
  public photo?: FileModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "firstVerifier",
      foreignKey: { name: "firstVerifierId", allowNull: true },
    });
    this.belongsTo(FileModel, {
      as: "photo",
      foreignKey: { name: "photoFileId", allowNull: true },
    });
  }
}

export const createVerificationModel = (sequelize: Sequelize) => {
  VerificationModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      firstVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      slaughterCoveredByByproduct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      modelName: "VerificationModel",
      tableName: "Verifications",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["registration_id"], unique: true }],
    },
  );
};
