import { DataTypes, Model, Sequelize } from "sequelize";
import { TSettlement } from "../../types/livestock/settlement.type";
import { RegistrationModel } from "./registration.model";
import { SettlementLineModel } from "./settlement-line.model";
import { SettlementPaymentProofModel } from "./settlement-payment-proof.model";
import { AdminModel } from "../user/admin.model";
import { FileModel } from "../global/file.model";

export class SettlementModel extends Model implements TSettlement {
  public id!: string;
  public registrationId!: string;
  public totalMeatAmount!: number;
  public totalByproductAmount!: number;
  public totalSlaughterCost!: number;
  public grossAmount!: number;
  public netPayable!: number;
  // Optional payout override — when the herder asks the money to go to a
  // different account THIS TIME. When any of these is non-null we use it
  // instead of the herder's default bank fields. Per-settlement only;
  // doesn't write back to the herder profile.
  public payoutBankAccount!: string | null;
  public payoutBankName!: string | null;
  public payoutAccountHolderName!: string | null;
  // Divisible payout: held pending medical-number approval; paid so far; when
  // the held part is released.
  public heldAmount!: number;
  public paidAmount!: number;
  public heldReleasedAt!: Date | null;
  public isPaid!: boolean;
  public paidAt!: Date | null;
  public settledById!: string | null;
  public notes!: string | null;
  public photoFileId!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public lines?: SettlementLineModel[];
  public paymentProofs?: SettlementPaymentProofModel[];
  public settledBy?: AdminModel;
  public photo?: FileModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "settledBy",
      foreignKey: { name: "settledById", allowNull: true },
    });
    this.belongsTo(FileModel, {
      as: "photo",
      foreignKey: { name: "photoFileId", allowNull: true },
    });
    this.hasMany(SettlementLineModel, {
      as: "lines",
      foreignKey: { name: "settlementId", allowNull: false },
    });
    this.hasMany(SettlementPaymentProofModel, {
      as: "paymentProofs",
      foreignKey: { name: "settlementId", allowNull: false },
    });
  }
}

export const createSettlementModel = (sequelize: Sequelize) => {
  SettlementModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      totalMeatAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      totalByproductAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalSlaughterCost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      grossAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      netPayable: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      payoutBankAccount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payoutBankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payoutAccountHolderName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      heldAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      heldReleasedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "SettlementModel",
      tableName: "Settlements",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["registration_id"], unique: true },
        { fields: ["is_paid"] },
      ],
    },
  );
};
