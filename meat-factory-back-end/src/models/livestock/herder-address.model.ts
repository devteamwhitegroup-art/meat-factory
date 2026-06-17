import { DataTypes, Model, Sequelize } from "sequelize";
import { THerderAddress } from "../../types/livestock/herder-address.type";

export class HerderAddressModel extends Model implements THerderAddress {
  public id!: string;
  public name!: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // FK is declared on the child (Herder.belongsTo(HerderAddress, ...)).
  // Empty associate keeps this catalogue self-contained.
  static associate(): void {}
}

export const createHerderAddressModel = (sequelize: Sequelize) => {
  HerderAddressModel.init(
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
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      modelName: "HerderAddressModel",
      tableName: "HerderAddresses",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["name"], unique: true },
        { fields: ["is_active"] },
      ],
    },
  );
};
