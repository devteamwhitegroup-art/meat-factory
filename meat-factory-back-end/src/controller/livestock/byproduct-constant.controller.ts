import { Op, WhereOptions } from 'sequelize';
import { ByproductConstantModel } from '../../models/livestock/byproduct-constant.model';
import { ByproductWrapperModel } from '../../models/livestock/byproduct-wrapper.model';
import { AnimalModel } from '../../models/livestock/animal.model';
import {
  TByproductConstant,
  TCreateByproductConstant,
  TDerivedByproduct,
  TGetByproductConstants,
  TUpdateByproductConstant
} from '../../types/livestock/byproduct-constant.type';
import { ANIMAL_TYPE } from '../../types/livestock/registration.type';
import { TPaginationGeneric } from '../../types/global/global.type';
import { pagination } from '../../utils';

export class ByproductConstantController {
  static async findIdCheck(id: string): Promise<ByproductConstantModel> {
    const row = await ByproductConstantModel.findByPk(id);
    if (!row) throw new Error('Byproduct constant not found');
    return row;
  }

  private static async _assertUnique(
    wrapperId: string,
    name: string,
    excludeId?: string
  ): Promise<void> {
    const where: WhereOptions = { wrapperId, name };
    if (excludeId) Object.assign(where, { id: { [Op.ne]: excludeId } });
    const existing = await ByproductConstantModel.findOne({ where });
    if (existing)
      throw new Error('Энэ багцад ийм нэртэй дайвар бүртгэгдсэн байна');
  }

  static async create(
    doc: TCreateByproductConstant
  ): Promise<TByproductConstant> {
    if (!doc.name || !doc.name.trim())
      throw new Error('Дайварын нэр шаардлагатай');
    if (!doc.wrapperId) throw new Error('Багц шаардлагатай');
    const qty = Number(doc.quantityPerAnimal);
    if (!qty || qty < 1)
      throw new Error('Тоо хэмжээ 1-ээс багагүй байх ёстой');

    const wrapper = await ByproductWrapperModel.findByPk(doc.wrapperId);
    if (!wrapper) throw new Error('Багц олдсонгүй');

    await this._assertUnique(doc.wrapperId, doc.name.trim());

    return await ByproductConstantModel.create({
      wrapperId: doc.wrapperId,
      name: doc.name.trim(),
      quantityPerAnimal: Math.floor(qty),
      unitWeightKg: doc.unitWeightKg ?? null,
      isActive: true
    });
  }

  static async list(
    doc: TGetByproductConstants
  ): Promise<TPaginationGeneric<TByproductConstant>> {
    const { offset, limit } = pagination(doc);
    const where: WhereOptions = {};
    if (doc.wrapperId) Object.assign(where, { wrapperId: doc.wrapperId });
    if (typeof doc.isActive === 'boolean')
      Object.assign(where, { isActive: doc.isActive });
    if (doc.search && doc.search.trim())
      Object.assign(where, {
        name: { [Op.iLike]: `%${doc.search.trim()}%` }
      });

    // Filter by animalType joins through wrapper → animal.
    const wrapperInclude: any = {
      model: ByproductWrapperModel,
      as: 'wrapper'
    };
    if (doc.animalType) {
      if (!Object.values(ANIMAL_TYPE).includes(doc.animalType))
        throw new Error(`Invalid animal type: ${doc.animalType}`);
      wrapperInclude.required = true;
      wrapperInclude.include = [
        {
          model: AnimalModel,
          as: 'animal',
          required: true,
          where: { animalType: doc.animalType }
        }
      ];
    }

    return await ByproductConstantModel.findAndCountAll({
      where,
      include: [wrapperInclude],
      offset,
      limit,
      order: [['name', 'ASC']],
      distinct: true
    });
  }

  static async getById(id: string): Promise<ByproductConstantModel> {
    return await this.findIdCheck(id);
  }

  static async update(
    doc: TUpdateByproductConstant
  ): Promise<ByproductConstantModel> {
    const row = await this.findIdCheck(doc.id);

    const nextWrapperId =
      doc.wrapperId !== undefined ? doc.wrapperId : row.wrapperId;
    const nextName = doc.name !== undefined ? doc.name.trim() : row.name;
    if (
      (doc.wrapperId !== undefined || doc.name !== undefined) &&
      (nextWrapperId !== row.wrapperId || nextName !== row.name)
    ) {
      await this._assertUnique(nextWrapperId, nextName, row.id);
    }

    if (doc.wrapperId !== undefined) {
      if (!doc.wrapperId) throw new Error('Багц шаардлагатай');
      const wrapper = await ByproductWrapperModel.findByPk(doc.wrapperId);
      if (!wrapper) throw new Error('Багц олдсонгүй');
      row.wrapperId = wrapper.id;
    }
    if (doc.name !== undefined) row.name = doc.name.trim();
    if (doc.quantityPerAnimal !== undefined) {
      const qty = Number(doc.quantityPerAnimal);
      if (!qty || qty < 1)
        throw new Error('Тоо хэмжээ 1-ээс багагүй байх ёстой');
      row.quantityPerAnimal = Math.floor(qty);
    }
    if (doc.unitWeightKg !== undefined)
      row.unitWeightKg = doc.unitWeightKg ?? null;
    if (typeof doc.isActive === 'boolean') row.isActive = doc.isActive;

    return await row.save();
  }

  static async remove(id: string): Promise<void> {
    const row = await this.findIdCheck(id);
    await row.destroy();
  }

  // Derive byproducts for a set of animal counts using active wrappers and
  // their active items. Wrappers join Animals by animalId — the animalType
  // and the cover flag both come off the joined Animal row, so all wrappers
  // of a horse share the same flag automatically.
  static async deriveForCounts(
    counts: Record<string, number>
  ): Promise<TDerivedByproduct[]> {
    const types = Object.keys(counts).filter((t) => (counts[t] ?? 0) > 0);
    if (types.length === 0) return [];

    const items = await ByproductConstantModel.findAll({
      where: { isActive: true },
      include: [
        {
          model: ByproductWrapperModel,
          as: 'wrapper',
          required: true,
          where: { isActive: true },
          include: [
            {
              model: AnimalModel,
              as: 'animal',
              required: true,
              where: { animalType: { [Op.in]: types } }
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    return items.map((item) => {
      const wrapper = item.wrapper as ByproductWrapperModel;
      const animal = wrapper.animal as AnimalModel;
      const animalType = animal.animalType;
      const animalCount = counts[animalType] ?? 0;
      const quantity = animalCount * item.quantityPerAnimal;
      const unitWeightKg =
        item.unitWeightKg != null ? Number(item.unitWeightKg) : null;
      const weightKg =
        unitWeightKg != null
          ? Number((quantity * unitWeightKg).toFixed(2))
          : null;
      return {
        animalType,
        wrapperId: wrapper.id,
        wrapperName: wrapper.name,
        name: item.name,
        quantity,
        unitWeightKg,
        weightKg,
        canCoverSlaughterCost: !!animal.canCoverSlaughterCost
      };
    });
  }
}
