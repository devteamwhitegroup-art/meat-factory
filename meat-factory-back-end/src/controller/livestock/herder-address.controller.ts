import { Op, WhereOptions } from 'sequelize';
import { HerderAddressModel } from '../../models/livestock/herder-address.model';
import {
  THerderAddress,
  TCreateHerderAddress,
  TGetHerderAddresses,
  TUpdateHerderAddress
} from '../../types/livestock/herder-address.type';
import { TPaginationGeneric } from '../../types/global/global.type';
import { findOrThrow, listPaginated } from '../../utils';

export class HerderAddressController {
  static findIdCheck(id: string): Promise<HerderAddressModel> {
    return findOrThrow(HerderAddressModel, id, 'Хаяг олдсонгүй');
  }

  // Case-insensitive uniqueness guard for the catalogue.
  private static async _assertUnique(
    name: string,
    excludeId?: string
  ): Promise<void> {
    const where: WhereOptions = {
      name: { [Op.iLike]: name }
    };
    if (excludeId) Object.assign(where, { id: { [Op.ne]: excludeId } });
    const existing = await HerderAddressModel.findOne({ where });
    if (existing)
      throw new Error('Энэ нэртэй хаяг бүртгэгдсэн байна');
  }

  static async create(
    doc: TCreateHerderAddress
  ): Promise<THerderAddress> {
    if (!doc.name || !doc.name.trim())
      throw new Error('Хаягийн нэр шаардлагатай');
    const name = doc.name.trim();
    await this._assertUnique(name);
    return await HerderAddressModel.create({
      name,
      isActive: doc.isActive ?? true
    });
  }

  static async list(
    doc: TGetHerderAddresses
  ): Promise<TPaginationGeneric<THerderAddress>> {
    const where: WhereOptions = {};
    if (typeof doc.isActive === 'boolean')
      Object.assign(where, { isActive: doc.isActive });
    if (doc.search && doc.search.trim())
      Object.assign(where, {
        name: { [Op.iLike]: `%${doc.search.trim()}%` }
      });

    return listPaginated(HerderAddressModel, doc, {
      where,
      order: [['name', 'ASC']]
    });
  }

  static async getById(id: string): Promise<HerderAddressModel> {
    return await this.findIdCheck(id);
  }

  static async update(
    doc: TUpdateHerderAddress
  ): Promise<HerderAddressModel> {
    const row = await this.findIdCheck(doc.id);
    if (doc.name !== undefined) {
      const next = doc.name.trim();
      if (!next) throw new Error('Хаягийн нэр шаардлагатай');
      if (next.toLowerCase() !== row.name.toLowerCase())
        await this._assertUnique(next, row.id);
      row.name = next;
    }
    if (typeof doc.isActive === 'boolean') row.isActive = doc.isActive;
    await row.save();
    return row;
  }

  static async remove(id: string): Promise<void> {
    const row = await this.findIdCheck(id);
    // FK on Herders.address_id is ON DELETE SET NULL so we don't need to
    // pre-detach anything — herders just lose their addressId reference.
    await row.destroy();
  }
}
