import { DataTypes, Model, Sequelize } from "sequelize";
import { TOrderPackage, TPackageItem } from "../../types/order/order.type";
import { FileModel } from "../global/file.model";

export class OrderPackageModel extends Model implements TOrderPackage {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public items!: TPackageItem[];
  public thumbnailFileId!: string | null;
  public imageFileIds!: string[];
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(): void {
    this.belongsTo(FileModel, {
      as: "thumbnail",
      foreignKey: { name: "thumbnailFileId", allowNull: true },
      onDelete: "SET NULL",
    });
  }
}

export const createOrderPackageModel = (sequelize: Sequelize) => {
  OrderPackageModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      // Whole ₮ (MNT has no minor unit in practice; QPay takes the integer).
      price: { type: DataTypes.INTEGER, allowNull: false },
      items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      // No FK per element (pg arrays can't carry one): ids are checked on
      // save, and a since-deleted file simply drops out of `images`.
      imageFileIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false, defaultValue: [] },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      modelName: "OrderPackageModel",
      tableName: "OrderPackages",
      timestamps: true,
      underscored: true,
      sequelize,
    },
  );
};
