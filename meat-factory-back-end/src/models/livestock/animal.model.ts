import { DataTypes, Model, Sequelize } from "sequelize";
import { TAnimal } from "../../types/livestock/animal.type";
import { ByproductWrapperModel } from "./byproduct-wrapper.model";

export class AnimalModel extends Model implements TAnimal {
  public id!: string;
  // Unique catalogue key (Үхэр, Адуу, …). Replaced the ANIMAL_TYPE enum.
  public name!: string;
  // Meat allowed on export shipments (horse only, for now).
  public isExport!: boolean;
  public pricePerAnimal!: number;
  public canCoverSlaughterCost!: boolean;
  // Carcass-to-saleable yield (%); horse 70 (bone-out), others 100.
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      isExport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      indexes: [{ fields: ["name"], unique: true }],
    },
  );
};
