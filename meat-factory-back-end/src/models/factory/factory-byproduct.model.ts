import { DataTypes, Model, Sequelize } from "sequelize";
import { TFactoryByproduct } from "../../types/factory/factory.type";
import { ByproductWrapperModel } from "../livestock/byproduct-wrapper.model";
import { ByproductConstantModel } from "../livestock/byproduct-constant.model";

// One priced byproduct a site receives. Exactly one of wrapperId (whole
// гэдэс) / constantId (single item, PRE_BUTCHERED only) is set.
export class FactoryByproductModel extends Model implements TFactoryByproduct {
  public id!: string;
  public factory!: string;
  public wrapperId!: string | null;
  public constantId!: string | null;
  public price!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  public wrapper?: ByproductWrapperModel;
  public constant?: ByproductConstantModel;

  static associate(): void {
    // Dropping a catalogue entry drops it from every site's list.
    this.belongsTo(ByproductWrapperModel, {
      as: "wrapper",
      foreignKey: { name: "wrapperId", allowNull: true },
      onDelete: "CASCADE",
    });
    this.belongsTo(ByproductConstantModel, {
      as: "constant",
      foreignKey: { name: "constantId", allowNull: true },
      onDelete: "CASCADE",
    });
  }
}

export const createFactoryByproductModel = (sequelize: Sequelize) => {
  FactoryByproductModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      factory: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      modelName: "FactoryByproductModel",
      tableName: "FactoryByproducts",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["factory", "wrapper_id"], unique: true },
        { fields: ["factory", "constant_id"], unique: true },
      ],
    },
  );
};
