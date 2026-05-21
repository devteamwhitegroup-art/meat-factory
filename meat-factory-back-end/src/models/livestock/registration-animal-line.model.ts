import { DataTypes, Model, Sequelize } from "sequelize";
import {
  ANIMAL_TYPE,
  TRegistrationAnimalLine,
} from "../../types/livestock/registration.type";
import { RegistrationModel } from "./registration.model";

export class RegistrationAnimalLineModel
  extends Model
  implements TRegistrationAnimalLine
{
  public id!: string;
  public registrationId!: string;
  public animalType!: ANIMAL_TYPE;
  public count!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
  }
}

export const createRegistrationAnimalLineModel = (sequelize: Sequelize) => {
  RegistrationAnimalLineModel.init(
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
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: "RegistrationAnimalLineModel",
      tableName: "RegistrationAnimalLines",
      timestamps: true,
      sequelize,
      indexes: [
        { fields: ["registrationId", "animalType"], unique: true },
      ],
    },
  );
};
