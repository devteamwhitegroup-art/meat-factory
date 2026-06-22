import { IncludeOptions, Op, WhereOptions } from "sequelize";
import { ByproductWrapperModel } from "../../models/livestock/byproduct-wrapper.model";
import { ByproductConstantModel } from "../../models/livestock/byproduct-constant.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { AnimalController } from "./animal.controller";
import {
  TByproductWrapper,
  TCreateByproductWrapper,
  TGetByproductWrappers,
  TUpdateByproductWrapper,
} from "../../types/livestock/byproduct-wrapper.type";
import { ANIMAL_TYPE } from "../../types/livestock/registration.type";
import { TPaginationGeneric } from "../../types/global/global.type";
import { findOrThrow, listPaginated } from "../../utils";

// Wrappers belong-to an Animal row by id. The public API still accepts
// animalType for ergonomics — we resolve it via AnimalController.resolveByType
// and store animalId. An Animals row is auto-created on demand (price 0,
// cover false) so creating wrappers for a not-yet-configured type still works.

const WRAPPER_INCLUDE = [
  { model: ByproductConstantModel, as: "items" },
  { model: AnimalModel, as: "animal" },
];

export class ByproductWrapperController {
  static findIdCheck(id: string): Promise<ByproductWrapperModel> {
    return findOrThrow(ByproductWrapperModel, id, "Багц олдсонгүй");
  }

  private static async _assertUnique(
    animalId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const where: WhereOptions = { animalId, name };
    if (excludeId) Object.assign(where, { id: { [Op.ne]: excludeId } });
    const existing = await ByproductWrapperModel.findOne({ where });
    if (existing)
      throw new Error("Энэ малын төрөлд ийм нэртэй багц бүртгэгдсэн байна");
  }

  static async create(
    doc: TCreateByproductWrapper,
  ): Promise<TByproductWrapper> {
    if (!doc.name || !doc.name.trim())
      throw new Error("Багцын нэр шаардлагатай");
    const animal = await AnimalController.resolveByType(doc.animalType);
    await this._assertUnique(animal.id, doc.name.trim());

    return await ByproductWrapperModel.create({
      animalId: animal.id,
      name: doc.name.trim(),
      isActive: true,
    });
  }

  static async list(
    doc: TGetByproductWrappers,
  ): Promise<TPaginationGeneric<TByproductWrapper>> {
    const where: WhereOptions = {};
    if (typeof doc.isActive === "boolean")
      Object.assign(where, { isActive: doc.isActive });
    if (doc.search && doc.search.trim())
      Object.assign(where, {
        name: { [Op.iLike]: `%${doc.search.trim()}%` },
      });

    // animalType filter joins through the Animals table.
    const animalInclude: IncludeOptions = { model: AnimalModel, as: "animal" };
    if (doc.animalType) {
      if (!Object.values(ANIMAL_TYPE).includes(doc.animalType))
        throw new Error(`Invalid animal type: ${doc.animalType}`);
      animalInclude.where = { animalType: doc.animalType };
      animalInclude.required = true;
    }

    return listPaginated(ByproductWrapperModel, doc, {
      where,
      include: [{ model: ByproductConstantModel, as: "items" }, animalInclude],
      order: [["name", "ASC"]],
      distinct: true,
    });
  }

  static getById(id: string): Promise<ByproductWrapperModel> {
    return findOrThrow(ByproductWrapperModel, id, "Багц олдсонгүй", {
      include: WRAPPER_INCLUDE,
    });
  }

  static async update(
    doc: TUpdateByproductWrapper,
  ): Promise<ByproductWrapperModel> {
    const row = await this.findIdCheck(doc.id);

    let nextAnimalId = row.animalId;
    if (doc.animalType !== undefined) {
      const animal = await AnimalController.resolveByType(doc.animalType);
      nextAnimalId = animal.id;
    }
    const nextName = doc.name !== undefined ? doc.name.trim() : row.name;
    if (
      (doc.animalType !== undefined || doc.name !== undefined) &&
      (nextAnimalId !== row.animalId || nextName !== row.name)
    ) {
      await this._assertUnique(nextAnimalId, nextName, row.id);
    }

    if (doc.animalType !== undefined) row.animalId = nextAnimalId;
    if (doc.name !== undefined) row.name = doc.name.trim();
    if (typeof doc.isActive === "boolean") row.isActive = doc.isActive;

    return await row.save();
  }

  static async remove(id: string): Promise<void> {
    const row = await this.findIdCheck(id);
    // Remove the wrapper and its items together.
    await ByproductConstantModel.destroy({ where: { wrapperId: id } });
    await row.destroy();
  }
}
