import { DataTypes, Model, Sequelize } from "sequelize";
import { TRegistrationAnimalLine } from "../../types/livestock/registration.type";
import { RegistrationModel } from "./registration.model";
import { AnimalModel } from "./animal.model";

// Each line records "this registration contains N of animalId" — animalType
// is reached through the joined Animal (FK), no longer a redundant ENUM here.
export class RegistrationAnimalLineModel
  extends Model
  implements TRegistrationAnimalLine
{
  public id!: string;
  public registrationId!: string;
  public animalId!: string;
  public count!: number;
  // Бой зардал per animal type, captured at weighing (before VERIFIED) so it
  // prints on the herder slip. Settlement defaults to this value.
  public slaughterCost!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public animal?: AnimalModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AnimalModel, {
      as: "animal",
      foreignKey: { name: "animalId", allowNull: false },
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
      animalId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      slaughterCost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      modelName: "RegistrationAnimalLineModel",
      tableName: "RegistrationAnimalLines",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["registration_id", "animal_id"], unique: true },
        { fields: ["animal_id"] },
      ],
    },
  );
};
