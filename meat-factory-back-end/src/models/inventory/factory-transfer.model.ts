import { DataTypes, Model, Sequelize } from "sequelize";
import {
  FACTORY_TRANSFER_STATUS,
  TFactoryTransfer,
} from "../../types/inventory/factory-transfer.type";
import { FactoryTransferLineModel } from "./factory-transfer-line.model";
import { AdminModel } from "../user/admin.model";

export class FactoryTransferModel extends Model implements TFactoryTransfer {
  public id!: string;
  public code!: string;
  public fromFactory!: string;
  public toFactory!: string;
  public status!: FACTORY_TRANSFER_STATUS;
  public notes!: string | null;
  public sentById!: string;
  public closedById!: string | null;
  public closedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public lines?: FactoryTransferLineModel[];
  public sentBy?: AdminModel;
  public closedBy?: AdminModel;

  static associate(): void {
    this.hasMany(FactoryTransferLineModel, {
      as: "lines",
      foreignKey: { name: "transferId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "sentBy",
      foreignKey: { name: "sentById", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "closedBy",
      foreignKey: { name: "closedById", allowNull: true },
    });
  }
}

export const createFactoryTransferModel = (sequelize: Sequelize) => {
  FactoryTransferModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // Factories.code (both ends).
      fromFactory: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      toFactory: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(FACTORY_TRANSFER_STATUS)),
        allowNull: false,
        defaultValue: FACTORY_TRANSFER_STATUS.IN_TRANSIT,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      closedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "FactoryTransferModel",
      tableName: "FactoryTransfers",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["code"], unique: true },
        { fields: ["from_factory"] },
        { fields: ["to_factory"] },
        { fields: ["status"] },
      ],
    },
  );
};
