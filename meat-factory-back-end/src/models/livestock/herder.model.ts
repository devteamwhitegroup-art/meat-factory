import { DataTypes, Model, Sequelize } from "sequelize";
import { THerder } from "../../types/livestock/herder.type";
import { RegistrationModel } from "./registration.model";
import { HerderAddressModel } from "./herder-address.model";

export class HerderModel extends Model implements THerder {
  public id!: string;
  public name!: string;
  public registrationNo!: string;
  public phone!: string | null;
  public bankAccount!: string | null;
  public bankName!: string | null;
  public accountHolderName!: string | null;
  public addressId!: string | null;
  // Legacy free-form address column — kept nullable so the catalogue is the
  // preferred path but ad-hoc / pre-existing values still resolve.
  public address!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registrations?: RegistrationModel[];
  public addressEntry?: HerderAddressModel;

  static associate(): void {
    this.hasMany(RegistrationModel, {
      as: "registrations",
      foreignKey: { name: "herderId", allowNull: false },
    });
    this.belongsTo(HerderAddressModel, {
      as: "addressEntry",
      foreignKey: { name: "addressId", allowNull: true },
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
      },
      bankAccount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accountHolderName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Don't set defaultValue here — Sequelize alter emits malformed SQL
      // (`SET DEFAULT NULL REFERENCES …`) on FK columns when a default is
      // declared, seen during the animalId refactor.
      addressId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      // Legacy free-form address. Resolver falls back to this when the
      // catalogue addressId isn't set.
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      modelName: "HerderModel",
      tableName: "Herders",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["name"] },
        { fields: ["registration_no"] },
        { fields: ["address_id"] },
      ],
    },
  );
};
