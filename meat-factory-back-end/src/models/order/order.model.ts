import { DataTypes, Model, Sequelize } from "sequelize";
import { ORDER_STATUS, TOrder, TOrderLine } from "../../types/order/order.type";

export class OrderModel extends Model implements TOrder {
  public id!: string;
  public code!: string;
  public customerName!: string;
  public phone!: string;
  public address!: string;
  public note!: string | null;
  public lines!: TOrderLine[];
  public total!: number;
  public status!: ORDER_STATUS;
  public qpayInvoiceId!: string | null;
  public paidAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  static associate(): void {}
}

export const createOrderModel = (sequelize: Sequelize) => {
  OrderModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      customerName: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false },
      note: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      lines: { type: DataTypes.JSONB, allowNull: false },
      total: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
        allowNull: false,
        defaultValue: ORDER_STATUS.PENDING,
      },
      qpayInvoiceId: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      paidAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    },
    {
      modelName: "OrderModel",
      tableName: "Orders",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [{ fields: ["status"] }, { fields: ["phone"] }],
    },
  );
};
