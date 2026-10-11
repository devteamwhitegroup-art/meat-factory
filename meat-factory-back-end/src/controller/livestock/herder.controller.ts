import { Op, WhereOptions } from "sequelize";
import { AdminController } from "../user/admin.controller";
import { PERMISSION } from "../../types/user/permission.type";
import { HerderModel } from "../../models/livestock/herder.model";
import { HerderAddressModel } from "../../models/livestock/herder-address.model";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { REGISTRATION_STATUS } from "../../types/livestock/registration.type";
import {
  TCreateHerder,
  THerder,
  TListHerders,
  TUpdateHerder,
} from "../../types/livestock/herder.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { findOrThrow, listPaginated } from "../../utils";

const HERDER_INCLUDE = [{ model: HerderAddressModel, as: "addressEntry" }];

export class HerderController {
  static findIdCheck(id: string): Promise<HerderModel> {
    return findOrThrow(HerderModel, id, "Herder not found");
  }

  // Resolve a catalogue addressId to a row; throws if it doesn't exist.
  private static async _assertAddressExists(addressId: string): Promise<void> {
    const row = await HerderAddressModel.findByPk(addressId);
    if (!row) throw new Error("Сонгосон хаяг олдсонгүй");
  }

  // Register / phone compare without spaces, register case-insensitive —
  // "уб 12345678" and "УБ12345678" are the same person.
  private static _normRegNo(v: string): string {
    return v.replace(/\s+/g, "").toUpperCase();
  }
  private static _normPhone(v: string | null | undefined): string | null {
    return v?.replace(/\s+/g, "") || null;
  }

  // One herder per register number and per phone. The unique indexes on the
  // model back this up; this gives the readable message.
  private static async _assertUnique(
    registrationNo: string,
    phone: string | null,
    exceptId?: string,
  ): Promise<void> {
    const dup = await HerderModel.findOne({
      where: {
        [Op.or]: [{ registrationNo }, ...(phone ? [{ phone }] : [])],
        ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}),
      },
    });
    if (!dup) return;
    throw new Error(
      dup.registrationNo === registrationNo
        ? `${registrationNo} регистртэй малчин бүртгэлтэй байна: ${dup.name}`
        : `${phone} утастай малчин бүртгэлтэй байна: ${dup.name}`,
    );
  }

  static async create(
    doc: TCreateHerder,
    context: TContext,
  ): Promise<HerderModel> {
    const {
      name,
      registrationNo,
      phone,
      bankAccount,
      bankName,
      accountHolderName,
      addressId,
      address,
    } = doc;

    if (!name || !name.trim()) throw new Error("Herder name is required");
    if (!registrationNo || !registrationNo.trim())
      throw new Error("Herder registration number is required");

    // Address: either an addressId from the catalogue OR a non-empty
    // free-form string. Intake-only staff (no HERDER_EDIT, e.g. эмч) do a
    // quick add — who + how to reach them: phone required, address optional
    // (bank details come later from нярав).
    const trimmedAddress = address?.trim() ?? "";
    const quick = !AdminController.hasPermission(context, PERMISSION.HERDER_EDIT);
    if (quick && !phone?.trim()) throw new Error("Утас шаардлагатай");
    if (!quick && !addressId && !trimmedAddress)
      throw new Error("Хаяг шаардлагатай (каталогоос сонгох эсвэл бичих)");
    if (addressId) await this._assertAddressExists(addressId);
    const regNo = this._normRegNo(registrationNo);
    const phoneNo = this._normPhone(phone);
    await this._assertUnique(regNo, phoneNo);

    const row = await HerderModel.create({
      name: name.trim(),
      registrationNo: regNo,
      phone: phoneNo,
      bankAccount: bankAccount ?? null,
      bankName: bankName?.trim() || null,
      accountHolderName: accountHolderName?.trim() || null,
      addressId: addressId ?? null,
      address: trimmedAddress || null,
    });
    // Re-fetch with the address include so resolver `Herder.address` falls
    // back to the catalogue name cleanly on the first response.
    return (await HerderModel.findByPk(row.id, {
      include: HERDER_INCLUDE,
    })) as HerderModel;
  }

  static async list(doc: TListHerders): Promise<TPaginationGeneric<THerder>> {
    const where: WhereOptions = {};

    if (doc.search && doc.search.trim()) {
      const term = `%${doc.search.trim()}%`;
      Object.assign(where, {
        [Op.or]: [
          { name: { [Op.iLike]: term } },
          { registrationNo: { [Op.iLike]: term } },
          { phone: { [Op.iLike]: term } },
        ],
      });
    }

    return listPaginated(HerderModel, doc, {
      where,
      include: HERDER_INCLUDE,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  // Admin herder page: what this herder has brought in and been paid,
  // across every factory. Cancelled registrations are counted, not summed.
  static async stats(id: string) {
    await this.findIdCheck(id);
    const regs = await RegistrationModel.findAll({
      where: { herderId: id },
      attributes: ["id", "status", "intakeDate"],
    });
    const active = regs.filter(
      (r) => r.status !== REGISTRATION_STATUS.CANCELLED,
    );
    const ids = active.map((r) => r.id);
    const withAnimal = [{ model: AnimalModel, as: "animal" }];
    const [lines, weighings, settlements] =
      ids.length > 0
        ? await Promise.all([
            RegistrationAnimalLineModel.findAll({
              where: { registrationId: ids },
              include: withAnimal,
            }),
            WeighingEntryModel.findAll({
              where: { registrationId: ids },
              include: withAnimal,
            }),
            SettlementModel.findAll({ where: { registrationId: ids } }),
          ])
        : [[], [], []];

    const byAnimal = new Map<string, { count: number; weightKg: number }>();
    const slot = (name: string) => {
      const s = byAnimal.get(name) ?? { count: 0, weightKg: 0 };
      byAnimal.set(name, s);
      return s;
    };
    for (const l of lines) slot(l.animal?.name ?? "—").count += l.count;
    let meatAmount = 0;
    for (const w of weighings) {
      slot(w.animal?.name ?? "—").weightKg += Number(w.weightKg);
      meatAmount += Number(w.weightKg) * Number(w.pricePerKg ?? 0);
    }
    const sum = (k: keyof SettlementModel) =>
      settlements.reduce((s, x) => s + Number(x[k] ?? 0), 0);
    const round2 = (n: number) => Number(n.toFixed(2));
    const dates = active.map((r) => new Date(r.intakeDate).getTime());
    const netPayable = sum("netPayable");
    const paidAmount = sum("paidAmount");

    return {
      registrationCount: active.length,
      cancelledCount: regs.length - active.length,
      firstIntakeDate: dates.length ? new Date(Math.min(...dates)) : null,
      lastIntakeDate: dates.length ? new Date(Math.max(...dates)) : null,
      animals: [...byAnimal.entries()].map(([animalType, s]) => ({
        animalType,
        count: s.count,
        weightKg: round2(s.weightKg),
      })),
      weighedKg: round2(weighings.reduce((s, w) => s + Number(w.weightKg), 0)),
      meatAmount: round2(meatAmount),
      settlementCount: settlements.length,
      slaughterCost: round2(sum("totalSlaughterCost")),
      byproductAmount: round2(sum("totalByproductAmount")),
      netPayable: round2(netPayable),
      paidAmount: round2(paidAmount),
      unpaidAmount: round2(netPayable - paidAmount),
    };
  }

  static getById(id: string): Promise<HerderModel> {
    return findOrThrow(HerderModel, id, "Herder not found", {
      include: [
        { model: RegistrationModel, as: "registrations" },
        { model: HerderAddressModel, as: "addressEntry" },
      ],
    });
  }

  static async update(doc: TUpdateHerder): Promise<HerderModel> {
    const {
      id,
      name,
      registrationNo,
      phone,
      bankAccount,
      bankName,
      accountHolderName,
      addressId,
      address,
    } = doc;
    const herder = await this.findIdCheck(id);

    if (name !== undefined) herder.name = name.trim();
    if (registrationNo !== undefined)
      herder.registrationNo = this._normRegNo(registrationNo);
    if (phone !== undefined) herder.phone = this._normPhone(phone);
    if (!herder.registrationNo)
      throw new Error("Herder registration number is required");
    if (herder.changed("registrationNo") || herder.changed("phone"))
      await this._assertUnique(herder.registrationNo, herder.phone, herder.id);
    if (bankAccount !== undefined) herder.bankAccount = bankAccount ?? null;
    if (bankName !== undefined) herder.bankName = bankName?.trim() || null;
    if (accountHolderName !== undefined)
      herder.accountHolderName = accountHolderName?.trim() || null;
    if (addressId !== undefined) {
      if (addressId) await this._assertAddressExists(addressId);
      herder.addressId = addressId ?? null;
    }
    if (address !== undefined) herder.address = address?.trim() || null;

    await herder.save();
    return (await HerderModel.findByPk(herder.id, {
      include: HERDER_INCLUDE,
    })) as HerderModel;
  }

  static async remove(id: string): Promise<void> {
    const herder = await this.findIdCheck(id);
    const count = await RegistrationModel.count({ where: { herderId: id } });
    if (count > 0) {
      throw new Error("Herder has registrations and cannot be deleted");
    }
    await herder.destroy();
  }
}
