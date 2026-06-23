import { DataTypes, Model, Sequelize } from "sequelize";
import { TSettlementPaymentProof } from "../../types/livestock/settlement-payment-proof.type";
import { SettlementModel } from "./settlement.model";
import { FileModel } from "../global/file.model";
import { AdminModel } from "../user/admin.model";

export class SettlementPaymentProofModel
  extends Model
  implements TSettlementPaymentProof
{
  public id!: string;
  public settlementId!: string;
  public fileId!: string;
  public sequenceNo!: number;
  public note!: string | null;
  public createdById!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public settlement?: SettlementModel;
  public file?: FileModel;
  public createdBy?: AdminModel;

  static associate(): void {
    this.belongsTo(SettlementModel, {
      as: "settlement",
      foreignKey: { name: "settlementId", allowNull: false },
    });
    this.belongsTo(FileModel, {
      as: "file",
      foreignKey: { name: "fileId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "createdBy",
      foreignKey: { name: "createdById", allowNull: true },
    });
  }
}

export const createSettlementPaymentProofModel = (sequelize: Sequelize) => {
  SettlementPaymentProofModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      sequenceNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      note: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "SettlementPaymentProofModel",
      tableName: "SettlementPaymentProofs",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["settlement_id"] },
        { fields: ["settlement_id", "sequence_no"], unique: true },
      ],
    },
  );
};
