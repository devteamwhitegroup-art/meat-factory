import { Op, WhereOptions } from 'sequelize';
import { HerderModel } from '../../models/livestock/herder.model';
import { RegistrationModel } from '../../models/livestock/registration.model';
import {
  TCreateHerder,
  THerder,
  TListHerders,
  TUpdateHerder
} from '../../types/livestock/herder.type';
import { TPaginationGeneric } from '../../types/global/global.type';
import { pagination } from '../../utils';

export class HerderController {
  static async findIdCheck(id: string): Promise<HerderModel> {
    const herder = await HerderModel.findByPk(id);
    if (!herder) {
      throw new Error('Herder not found');
    }
    return herder;
  }

  static async create(doc: TCreateHerder): Promise<THerder> {
    const { name, registrationNo, phone, bankAccount, address } = doc;

    if (!name || !name.trim()) throw new Error('Herder name is required');
    if (!registrationNo || !registrationNo.trim())
      throw new Error('Herder registration number is required');
    if (!address || !address.trim())
      throw new Error('Herder address is required');

    return await HerderModel.create({
      name: name.trim(),
      registrationNo: registrationNo.trim(),
      phone: phone ?? null,
      bankAccount: bankAccount ?? null,
      address: address.trim()
    });
  }

  static async list(
    doc: TListHerders
  ): Promise<TPaginationGeneric<THerder>> {
    const { offset, limit } = pagination(doc);
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

    return await HerderModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
  }

  static async getById(id: string): Promise<HerderModel> {
    const herder = await HerderModel.findByPk(id, {
      include: [{ model: RegistrationModel, as: 'registrations' }]
    });
    if (!herder) throw new Error('Herder not found');
    return herder;
  }

  static async update(doc: TUpdateHerder): Promise<HerderModel> {
    const { id, name, registrationNo, phone, bankAccount, address } = doc;
    const herder = await this.findIdCheck(id);

    if (name !== undefined) herder.name = name.trim();
    if (registrationNo !== undefined)
      herder.registrationNo = registrationNo.trim();
    if (phone !== undefined) herder.phone = phone ?? null;
    if (bankAccount !== undefined) herder.bankAccount = bankAccount ?? null;
    if (address !== undefined) herder.address = address.trim();

    return await herder.save();
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
