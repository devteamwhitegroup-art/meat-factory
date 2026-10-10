import { Op, Transaction, WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { MedicalNumberModel } from "../../models/livestock/medical-number.model";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { HerderModel } from "../../models/livestock/herder.model";
import { AdminModel } from "../../models/user/admin.model";
import { RegistrationController } from "./registration.controller";
import { AdminController } from "../user/admin.controller";
import {
  MEDICAL_NUMBER_RE,
  MEDICAL_NUMBER_STATUS,
  TGetMedicalNumbers,
} from "../../types/livestock/medical-number.type";
import { REGISTRATION_STATUS } from "../../types/livestock/registration.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { ADMIN_ROLE } from "../../types/user/admin.type";
import { dateRangeWhere, findOrThrow, listPaginated } from "../../utils";

// Intake staff and the vet may enter numbers; only the vet (or admin) rules
// on them.
const ENTRY_ROLES = [
  ADMIN_ROLE.STOREKEEPER,
  ADMIN_ROLE.DOCTOR,
  ADMIN_ROLE.ADMIN,
];
const CHECK_ROLES = [ADMIN_ROLE.DOCTOR, ADMIN_ROLE.ADMIN];

export class MedicalNumberController {
  static normalize(raw: string): string {
    const n = (raw ?? "").trim();
    if (!MEDICAL_NUMBER_RE.test(n))
      throw new Error(`Мал эмнэлгийн дугаар 7 оронтой тоо байна: «${raw}»`);
    return n;
  }

  // Intake input → validated, de-duplicated list.
  static parseList(raw: string[] | null | undefined): string[] {
    return [...new Set((raw ?? []).map((r) => this.normalize(r)))];
  }

  static listFor(registrationId: string): Promise<MedicalNumberModel[]> {
    return MedicalNumberModel.findAll({
      where: { registrationId },
      order: [["createdAt", "ASC"]],
    });
  }

  // Registration is approved only when every number is checked APPROVED —
  // denormalized onto Registrations so settlement pay/release stay a flag read.
  static async syncApproval(
    registrationId: string,
    t: Transaction,
  ): Promise<void> {
    const rows = await MedicalNumberModel.findAll({
      where: { registrationId },
      transaction: t,
    });
    const approved =
      rows.length > 0 &&
      rows.every((r) => r.status === MEDICAL_NUMBER_STATUS.APPROVED);
    await RegistrationModel.update(
      { medicalNumberApproved: approved },
      { where: { id: registrationId }, transaction: t },
    );
  }

  static async add(
    registrationId: string,
    number: string,
    context: TContext,
  ): Promise<MedicalNumberModel> {
    RegistrationController.assertActorRole(context, ENTRY_ROLES);
    const reg = await RegistrationController.findIdCheck(
      registrationId,
      context,
    );
    if (
      reg.status === REGISTRATION_STATUS.CANCELLED ||
      reg.status === REGISTRATION_STATUS.SETTLED
    )
      throw new Error("Бүртгэл хаагдсан тул дугаар нэмэх боломжгүй");
    const n = this.normalize(number);
    if (
      await MedicalNumberModel.findOne({ where: { registrationId, number: n } })
    )
      throw new Error("Энэ дугаар бүртгэгдсэн байна");

    return sequelize.transaction(async (t) => {
      const row = await MedicalNumberModel.create(
        { registrationId, number: n },
        { transaction: t },
      );
      await this.syncApproval(registrationId, t);
      return row;
    });
  }

  // Typo fix only — once the vet has ruled on a number it stays on record.
  static async remove(id: string, context: TContext): Promise<void> {
    RegistrationController.assertActorRole(context, ENTRY_ROLES);
    const row = await findOrThrow(MedicalNumberModel, id, "Дугаар олдсонгүй");
    await RegistrationController.findIdCheck(row.registrationId, context);
    if (row.status !== MEDICAL_NUMBER_STATUS.PENDING)
      throw new Error("Шалгагдсан дугаарыг устгах боломжгүй");
    await sequelize.transaction(async (t) => {
      await row.destroy({ transaction: t });
      await this.syncApproval(row.registrationId, t);
    });
  }

  // Vet's ruling after checking the government service. PENDING resets it.
  static async setStatus(
    id: string,
    status: MEDICAL_NUMBER_STATUS,
    context: TContext,
  ): Promise<MedicalNumberModel> {
    RegistrationController.assertActorRole(context, CHECK_ROLES);
    if (!Object.values(MEDICAL_NUMBER_STATUS).includes(status))
      throw new Error(`Invalid status: ${status}`);
    const row = await findOrThrow(MedicalNumberModel, id, "Дугаар олдсонгүй");
    await RegistrationController.findIdCheck(row.registrationId, context);
    const pending = status === MEDICAL_NUMBER_STATUS.PENDING;
    return sequelize.transaction(async (t) => {
      await row.update(
        {
          status,
          checkedById: pending ? null : context.id,
          checkedAt: pending ? null : new Date(),
        },
        { transaction: t },
      );
      await this.syncApproval(row.registrationId, t);
      return row;
    });
  }

  // The vet's worklist. Cancelled intakes are left out.
  static async list(
    doc: TGetMedicalNumbers,
    context: TContext,
  ): Promise<TPaginationGeneric<MedicalNumberModel>> {
    const factory = AdminController.readFactory(context, doc.factory);
    const where: WhereOptions = {};
    if (doc.status) Object.assign(where, { status: doc.status });
    const digits = (doc.number ?? "").replace(/\D/g, "");
    if (digits) Object.assign(where, { number: { [Op.like]: `%${digits}%` } });
    Object.assign(where, dateRangeWhere(doc.dateRange, "createdAt"));

    return listPaginated(MedicalNumberModel, doc, {
      where,
      include: [
        {
          model: RegistrationModel,
          as: "registration",
          required: true,
          where: {
            status: { [Op.ne]: REGISTRATION_STATUS.CANCELLED },
            ...(factory ? { factory } : {}),
          },
          include: [{ model: HerderModel, as: "herder" }],
        },
        {
          model: AdminModel,
          as: "checkedBy",
          attributes: ["id", "param", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }
}
