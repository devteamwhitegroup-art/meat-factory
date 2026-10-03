import { DataTypes, Model, Sequelize } from "sequelize";
import {
  PRINT_JOB_STATUS,
  PRINT_JOB_TYPE,
  TPrintJob,
} from "../../types/print/print.type";

export class PrintJobModel extends Model implements TPrintJob {
  public id!: string;
  public printerKey!: string;
  public printerIp!: string | null;
  public type!: PRINT_JOB_TYPE;
  public refId!: string | null;
  public status!: PRINT_JOB_STATUS;
  public payloadBase64!: string;
  public attempts!: number;
  public error!: string | null;
  public claimedAt!: Date | null;
  public printedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Polymorphic refId (points at Sales / Shipment / Settlement by `type`), so
  // no Sequelize association — nothing to wire.
  static associate(): void {}
}

export const createPrintJobModel = (sequelize: Sequelize) => {
  PrintJobModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      printerKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // Nullable only so `alter` can add it over pre-existing rows.
      printerIp: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      type: {
        type: DataTypes.ENUM(...Object.values(PRINT_JOB_TYPE)),
        allowNull: false,
      },
      refId: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(PRINT_JOB_STATUS)),
        allowNull: false,
        defaultValue: PRINT_JOB_STATUS.PENDING,
      },
      payloadBase64: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      claimedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      printedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "PrintJobModel",
      tableName: "PrintJobs",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["status", "created_at"] }],
    },
  );
};
