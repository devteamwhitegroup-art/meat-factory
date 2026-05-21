import { DataTypes, Model, Sequelize } from "sequelize";
import { THerder } from "../../types/livestock/herder.type";
import { RegistrationModel } from "./registration.model";

export class HerderModel extends Model implements THerder {
  public id!: string;
  public name!: string;
  public registrationNo!: string;
  public phone!: string | null;
  public bankAccount!: string | null;
  public address!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registrations?: RegistrationModel[];

  static associate(): void {
    this.hasMany(RegistrationModel, {
      as: "registrations",
      foreignKey: { name: "herderId", allowNull: false },
    });
  }
}

export const createHerderModel = (sequelize: Sequelize) => {
  HerderModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      registrationNo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      bankAccount: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      modelName: "HerderModel",
      tableName: "Herders",
      timestamps: true,
      sequelize,
      indexes: [{ fields: ["name"] }, { fields: ["registrationNo"] }],
    },
  );
};
