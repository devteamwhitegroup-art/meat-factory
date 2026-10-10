import { IncludeOptions, Op, WhereOptions } from "sequelize";
import { ByproductConstantModel } from "../../models/livestock/byproduct-constant.model";
import { ByproductWrapperModel } from "../../models/livestock/byproduct-wrapper.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import {
  TByproductConstant,
  TCreateByproductConstant,
  TGetByproductConstants,
  TUpdateByproductConstant,
} from "../../types/livestock/byproduct-constant.type";
import { TPaginationGeneric } from "../../types/global/global.type";
import { activeSearchWhere, findOrThrow, listPaginated } from "../../utils";

export class ByproductConstantController {
  static findIdCheck(id: string): Promise<ByproductConstantModel> {
    return findOrThrow(
      ByproductConstantModel,
      id,
      "Byproduct constant not found",
    );
  }

  private static async _assertUnique(
    wrapperId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const where: WhereOptions = { wrapperId, name };
    if (excludeId) Object.assign(where, { id: { [Op.ne]: excludeId } });
    const existing = await ByproductConstantModel.findOne({ where });
    if (existing)
      throw new Error("Энэ багцад ийм нэртэй дайвар бүртгэгдсэн байна");
  }

  static async create(
    doc: TCreateByproductConstant,
  ): Promise<TByproductConstant> {
    if (!doc.name || !doc.name.trim())
      throw new Error("Дайварын нэр шаардлагатай");
    if (!doc.wrapperId) throw new Error("Багц шаардлагатай");
    const qty = Number(doc.quantityPerAnimal);
    if (!qty || qty < 1) throw new Error("Тоо хэмжээ 1-ээс багагүй байх ёстой");

    const wrapper = await ByproductWrapperModel.findByPk(doc.wrapperId);
    if (!wrapper) throw new Error("Багц олдсонгүй");

    await this._assertUnique(doc.wrapperId, doc.name.trim());

    return await ByproductConstantModel.create({
      wrapperId: doc.wrapperId,
      name: doc.name.trim(),
      quantityPerAnimal: Math.floor(qty),
      unitWeightKg: doc.unitWeightKg ?? null,
      isActive: true,
    });
  }

  static async list(
    doc: TGetByproductConstants,
  ): Promise<TPaginationGeneric<TByproductConstant>> {
    const where = activeSearchWhere(doc);
    if (doc.wrapperId) Object.assign(where, { wrapperId: doc.wrapperId });

    // Filter by animalType joins through wrapper → animal.
    const wrapperInclude: IncludeOptions = {
      model: ByproductWrapperModel,
      as: "wrapper",
    };
    if (doc.animalType) {
      wrapperInclude.required = true;
      wrapperInclude.include = [
        {
          model: AnimalModel,
          as: "animal",
          required: true,
          where: { name: doc.animalType },
        },
      ];
    }

    return listPaginated(ByproductConstantModel, doc, {
      where,
      include: [wrapperInclude],
      order: [["name", "ASC"]],
      distinct: true,
    });
  }

  static async getById(id: string): Promise<ByproductConstantModel> {
    return await this.findIdCheck(id);
  }

  static async update(
    doc: TUpdateByproductConstant,
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
      if (!doc.wrapperId) throw new Error("Багц шаардлагатай");
      const wrapper = await ByproductWrapperModel.findByPk(doc.wrapperId);
      if (!wrapper) throw new Error("Багц олдсонгүй");
      row.wrapperId = wrapper.id;
    }
    if (doc.name !== undefined) row.name = doc.name.trim();
    if (doc.quantityPerAnimal !== undefined) {
      const qty = Number(doc.quantityPerAnimal);
      if (!qty || qty < 1)
        throw new Error("Тоо хэмжээ 1-ээс багагүй байх ёстой");
      row.quantityPerAnimal = Math.floor(qty);
    }
    if (doc.unitWeightKg !== undefined)
      row.unitWeightKg = doc.unitWeightKg ?? null;
    if (typeof doc.isActive === "boolean") row.isActive = doc.isActive;

    return await row.save();
  }

  static async remove(id: string): Promise<void> {
    const row = await this.findIdCheck(id);
    await row.destroy();
  }
}
