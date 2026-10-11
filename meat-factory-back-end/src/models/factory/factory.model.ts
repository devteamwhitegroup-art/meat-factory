import { DataTypes, Model, Sequelize } from "sequelize";
import { FACTORY_KIND, TFactory } from "../../types/factory/factory.type";

export class FactoryModel extends Model implements TFactory {
  public code!: string;
  public name!: string;
  public kind!: FACTORY_KIND;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(): void {}
}

export const createFactoryModel = (sequelize: Sequelize) => {
  FactoryModel.init(
    {
      // Natural key — the value every `factory` column stores.
      code: {
        primaryKey: true,
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kind: {
        type: DataTypes.ENUM(...Object.values(FACTORY_KIND)),
        allowNull: false,
      },
      // Inactive = hidden from pickers and refused for new records; history
      // keeps referencing it.
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      modelName: "FactoryModel",
      tableName: "Factories",
      timestamps: true,
      underscored: true,
      sequelize,
    },
  );
};
