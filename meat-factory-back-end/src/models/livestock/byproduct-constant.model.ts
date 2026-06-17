import { DataTypes, Model, Sequelize } from "sequelize";
import { TByproductConstant } from "../../types/livestock/byproduct-constant.type";
import { ByproductWrapperModel } from "./byproduct-wrapper.model";

// animalType + canCoverSlaughterCost both come off the joined Animal row
// (constant → wrapper → animal), so we no longer duplicate them here.
export class ByproductConstantModel
  extends Model
  implements TByproductConstant
{
  public id!: string;
  public wrapperId!: string;
  public name!: string;
  public quantityPerAnimal!: number;
  public unitWeightKg!: number | null;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  public wrapper?: ByproductWrapperModel;

  static associate(): void {
    this.belongsTo(ByproductWrapperModel, {
      as: "wrapper",
      foreignKey: { name: "wrapperId", allowNull: false },
    });
  }
}

export const createByproductConstantModel = (sequelize: Sequelize) => {
  ByproductConstantModel.init(
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
      quantityPerAnimal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unitWeightKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      modelName: "ByproductConstantModel",
      tableName: "ByproductConstants",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["wrapper_id", "name"], unique: true },
        { fields: ["wrapper_id"] },
        { fields: ["is_active"] },
      ],
    },
  );
};
