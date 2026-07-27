import { DataTypes, Model, Sequelize } from "sequelize";
import {
  TWeighingEntryAudit,
  WEIGHING_AUDIT_ACTION,
} from "../../types/livestock/weighing-entry.type";
import { RegistrationModel } from "./registration.model";
import { AdminModel } from "../user/admin.model";

// Append-only log of add/edit/remove on a WeighingEntry. Exists because a
// mistake fixed by a manager after weighing has no other trace — the entry
// itself just gets overwritten (or, on delete, disappears entirely).
// weighingEntryId is a plain column, not a FK: the referenced row may have
// been deleted, and this log must survive that. Keyed by registrationId for
// lookup even in that case.
export class WeighingEntryAuditModel
  extends Model
  implements TWeighingEntryAudit
{
  public id!: string;
  public registrationId!: string;
  public weighingEntryId!: string;
  public action!: WEIGHING_AUDIT_ACTION;
  public actorId!: string;
  public weightKgBefore!: number | null;
  public weightKgAfter!: number | null;
  public pricePerKgBefore!: number | null;
  public pricePerKgAfter!: number | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public registration?: RegistrationModel;
  public actor?: AdminModel;

  static associate(): void {
    this.belongsTo(RegistrationModel, {
      as: "registration",
      foreignKey: { name: "registrationId", allowNull: false },
    });
    this.belongsTo(AdminModel, {
      as: "actor",
      foreignKey: { name: "actorId", allowNull: false },
    });
  }
}

export const createWeighingEntryAuditModel = (sequelize: Sequelize) => {
  WeighingEntryAuditModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false,
      },
      weighingEntryId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM(...Object.values(WEIGHING_AUDIT_ACTION)),
        allowNull: false,
      },
      weightKgBefore: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      weightKgAfter: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      pricePerKgBefore: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
      },
      pricePerKgAfter: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      modelName: "WeighingEntryAuditModel",
      tableName: "WeighingEntryAudits",
      timestamps: true,
      underscored: true,
      sequelize,
      indexes: [
        { fields: ["registration_id"] },
        { fields: ["weighing_entry_id"] },
      ],
    },
  );
};
