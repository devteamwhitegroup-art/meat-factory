import { DataTypes, Model, Sequelize } from "sequelize";
import { TByproductBundle } from "../../types/livestock/byproduct-bundle.type";
import { RegistrationModel } from "./registration.model";
import { ByproductWrapperModel } from "./byproduct-wrapper.model";

// Herder-facing byproduct row: one per wrapper (гэдэс) per registration.
// `count` bundles received, `herderCount` of them taken back by the herder;
// the rest stay with the factory and credit (count − herderCount) × unitPrice
// to the settlement. unitPrice is the wrapper price snapshotted at save.
export class ByproductBundleModel extends Model implements TByproductBundle {
  public id!: string;
  public registrationId!: string;
  public wrapperId!: string;
  public count!: number;
  public herderCount!: number;
  public unitPrice!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public wrapper?: ByproductWrapperModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(ByproductWrapperModel, {
      as: "wrapper",
      foreignKey: { name: "wrapperId", allowNull: false },
    });
  }
}

export const createByproductBundleModel = (sequelize: Sequelize) => {
  ByproductBundleModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      herderCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      modelName: "ByproductBundleModel",
      tableName: "ByproductBundles",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["registration_id", "wrapper_id"], unique: true }],
    },
  );
};
