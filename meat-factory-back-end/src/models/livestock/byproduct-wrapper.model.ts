import { DataTypes, Model, Sequelize } from "sequelize";
import { TByproductWrapper } from "../../types/livestock/byproduct-wrapper.type";
import { ByproductConstantModel } from "./byproduct-constant.model";
import { AnimalModel } from "./animal.model";

export class ByproductWrapperModel extends Model implements TByproductWrapper {
  public id!: string;
  public animalId!: string;
  public name!: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  public items?: ByproductConstantModel[];
  public animal?: AnimalModel;

  static associate(): void {
    this.hasMany(ByproductConstantModel, {
      as: "items",
      foreignKey: { name: "wrapperId", allowNull: true },
    });
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: false },
    });
  }
}

export const createByproductWrapperModel = (sequelize: Sequelize) => {
  ByproductWrapperModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      animalId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      modelName: "ByproductWrapperModel",
      tableName: "ByproductWrappers",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["animal_id", "name"], unique: true },
        { fields: ["animal_id"] },
        { fields: ["is_active"] },
      ],
    },
  );
};
