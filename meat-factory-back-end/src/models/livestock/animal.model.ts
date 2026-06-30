import { DataTypes, Model, Sequelize } from "sequelize";
import { ANIMAL_TYPE } from "../../types/livestock/registration.type";
import { TAnimal } from "../../types/livestock/animal.type";
import { ByproductWrapperModel } from "./byproduct-wrapper.model";

export class AnimalModel extends Model implements TAnimal {
  public id!: string;
  public animalType!: ANIMAL_TYPE;
  public name!: string;
  public pricePerAnimal!: number;
  public canCoverSlaughterCost!: boolean;
  // Carcass-to-saleable yield (%); horse seeds at 70 (bone-out), others 100.
  public yieldPercent!: number;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  public byproductWrappers?: ByproductWrapperModel[];

  static associate(): void {
    this.hasMany(ByproductWrapperModel, {
      as: "byproductWrappers",
      foreignKey: { name: "animalId", allowNull: false },
    });
  }
}

export const createAnimalModel = (sequelize: Sequelize) => {
  AnimalModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      animalType: {
        type: DataTypes.ENUM(...Object.values(ANIMAL_TYPE)),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pricePerAnimal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      canCoverSlaughterCost: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      yieldPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      modelName: "AnimalModel",
      tableName: "Animals",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["animal_type"], unique: true }],
    },
  );
};
