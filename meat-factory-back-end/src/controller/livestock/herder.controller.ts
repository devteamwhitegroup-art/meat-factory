import { Op, WhereOptions } from 'sequelize';
import { HerderModel } from '../../models/livestock/herder.model';
import { HerderAddressModel } from '../../models/livestock/herder-address.model';
import { RegistrationModel } from '../../models/livestock/registration.model';
import {
  TCreateHerder,
  THerder,
  TListHerders,
  TUpdateHerder
} from '../../types/livestock/herder.type';
import { TPaginationGeneric } from '../../types/global/global.type';
import { findOrThrow, listPaginated } from '../../utils';

const HERDER_INCLUDE = [
  { model: HerderAddressModel, as: 'addressEntry' }
];

export class HerderController {
  static findIdCheck(id: string): Promise<HerderModel> {
    return findOrThrow(HerderModel, id, 'Herder not found');
  }

  // Resolve a catalogue addressId to a row; throws if it doesn't exist.
  private static async _assertAddressExists(addressId: string): Promise<void> {
    const row = await HerderAddressModel.findByPk(addressId);
    if (!row) throw new Error('Сонгосон хаяг олдсонгүй');
  }

  static async create(doc: TCreateHerder): Promise<HerderModel> {
    const {
      name,
      registrationNo,
      phone,
      bankAccount,
      bankName,
      accountHolderName,
      addressId,
      address
    } = doc;

    if (!name || !name.trim()) throw new Error('Herder name is required');
    if (!registrationNo || !registrationNo.trim())
      throw new Error('Herder registration number is required');

    // Address: either an addressId from the catalogue OR a non-empty
    // free-form string. Reject when both are missing.
    const trimmedAddress = address?.trim() ?? '';
    if (!addressId && !trimmedAddress)
      throw new Error('Хаяг шаардлагатай (каталогоос сонгох эсвэл бичих)');
    if (addressId) await this._assertAddressExists(addressId);

    const row = await HerderModel.create({
      name: name.trim(),
      registrationNo: registrationNo.trim(),
      phone: phone ?? null,
      bankAccount: bankAccount ?? null,
      bankName: bankName?.trim() || null,
      accountHolderName: accountHolderName?.trim() || null,
      addressId: addressId ?? null,
      address: trimmedAddress || null
    });
    // Re-fetch with the address include so resolver `Herder.address` falls
    // back to the catalogue name cleanly on the first response.
    return (await HerderModel.findByPk(row.id, {
      include: HERDER_INCLUDE
    })) as HerderModel;
  }

  static async list(
    doc: TListHerders
  ): Promise<TPaginationGeneric<THerder>> {
    const where: WhereOptions = {};

    if (doc.search && doc.search.trim()) {
      const term = `%${doc.search.trim()}%`;
      Object.assign(where, {
        [Op.or]: [
          { name: { [Op.iLike]: term } },
          { registrationNo: { [Op.iLike]: term } },
          { phone: { [Op.iLike]: term } }
        ]
      });
    }

    return listPaginated(HerderModel, doc, {
      where,
      include: HERDER_INCLUDE,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
  }

  static getById(id: string): Promise<HerderModel> {
    return findOrThrow(HerderModel, id, 'Herder not found', {
      include: [
        { model: RegistrationModel, as: 'registrations' },
        { model: HerderAddressModel, as: 'addressEntry' }
      ]
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
      address
    } = doc;
    const herder = await this.findIdCheck(id);

    if (name !== undefined) herder.name = name.trim();
    if (registrationNo !== undefined)
      herder.registrationNo = registrationNo.trim();
    if (phone !== undefined) herder.phone = phone ?? null;
    if (bankAccount !== undefined) herder.bankAccount = bankAccount ?? null;
    if (bankName !== undefined)
      herder.bankName = bankName?.trim() || null;
    if (accountHolderName !== undefined)
      herder.accountHolderName = accountHolderName?.trim() || null;
    if (addressId !== undefined) {
      if (addressId) await this._assertAddressExists(addressId);
      herder.addressId = addressId ?? null;
    }
    if (address !== undefined)
      herder.address = address?.trim() || null;

    await herder.save();
    return (await HerderModel.findByPk(herder.id, {
      include: HERDER_INCLUDE
    })) as HerderModel;
  }

  static async remove(id: string): Promise<void> {
    const herder = await this.findIdCheck(id);
    const count = await RegistrationModel.count({ where: { herderId: id } });
    if (count > 0) {
      throw new Error('Herder has registrations and cannot be deleted');
    }
    await herder.destroy();
  }
}
