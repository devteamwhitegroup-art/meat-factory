import { DataTypes, Model, Sequelize } from "sequelize";
import { TByproductBundle } from "../../types/livestock/byproduct-bundle.type";
import { RegistrationModel } from "./registration.model";
import { ByproductWrapperModel } from "./byproduct-wrapper.model";
import { ByproductConstantModel } from "./byproduct-constant.model";

// Herder-facing byproduct row per registration: one per wrapper (гэдэс) or
// per item (constantId, PRE_BUTCHERED only) — exactly one is set. `count` received, `herderCount` of them taken back by the herder; the
// rest stay with the factory and credit (count − herderCount) × unitPrice to
// the settlement. unitPrice = the site's price list, snapshotted at save
// (PRE_BUTCHERED: as typed by the receiver).
export class ByproductBundleModel extends Model implements TByproductBundle {
  public id!: string;
  public registrationId!: string;
  public wrapperId!: string | null;
  public constantId!: string | null;
  public count!: number;
  public herderCount!: number;
  public unitPrice!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public wrapper?: ByproductWrapperModel;
  public constant?: ByproductConstantModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    // RESTRICT: a catalogue entry with intake history can't be deleted.
    this.belongsTo(ByproductWrapperModel, {
      as: "wrapper",
      foreignKey: { name: "wrapperId", allowNull: true },
      onDelete: "RESTRICT",
    });
    this.belongsTo(ByproductConstantModel, {
      as: "constant",
      foreignKey: { name: "constantId", allowNull: true },
      onDelete: "RESTRICT",
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
      indexes: [
        { fields: ["registration_id", "wrapper_id"], unique: true },
        { fields: ["registration_id", "constant_id"], unique: true },
      ],
    },
  );
};
