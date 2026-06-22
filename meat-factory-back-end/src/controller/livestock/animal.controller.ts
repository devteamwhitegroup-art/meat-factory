import { Op } from "sequelize";
import { AnimalModel } from "../../models/livestock/animal.model";
import { TAnimal, TUpsertAnimal } from "../../types/livestock/animal.type";
import { ANIMAL_TYPE } from "../../types/livestock/registration.type";

export class AnimalController {
  static async list(): Promise<TAnimal[]> {
    return await AnimalModel.findAll({ order: [["animalType", "ASC"]] });
  }

  static async findByType(
    animalType: ANIMAL_TYPE,
  ): Promise<AnimalModel | null> {
    return await AnimalModel.findOne({ where: { animalType } });
  }

  // Resolve an Animal row by enum type, auto-creating it if missing (price 0
  // / cover false defaults). Used wherever a workflow row (registration line,
  // weighing entry, byproduct log, settlement line) needs to store animalId.
  // The catalog seed at boot pre-creates one per ANIMAL_TYPE so the create
  // branch is normally inert — it just guards against a deleted row.
  static async resolveByType(animalType: ANIMAL_TYPE): Promise<AnimalModel> {
    if (!Object.values(ANIMAL_TYPE).includes(animalType))
      throw new Error(`Invalid animal type: ${animalType}`);
    const [row] = await AnimalModel.findOrCreate({
      where: { animalType },
      defaults: {
        animalType,
        pricePerAnimal: 0,
        canCoverSlaughterCost: false,
        yieldPercent: animalType === ANIMAL_TYPE.HORSE ? 70 : 100,
        isActive: true,
      },
    });
    return row;
  }

  // Bulk lookup. Returns Record<ANIMAL_TYPE, animalId>. Useful when a
  // controller writes many rows that each need an animalId.
  static async mapTypesToIds(
    types: ANIMAL_TYPE[],
  ): Promise<Record<string, string>> {
    if (types.length === 0) return {};
    // Ensure rows exist for every requested type. Catalog is tiny so the
    // findOrCreate sweep is cheap; serial keeps the code simple.
    const out: Record<string, string> = {};
    for (const t of types) {
      const row = await this.resolveByType(t);
      out[t] = row.id;
    }
    return out;
  }

  // Inverse of the above — id → animalType. Helpful when reading rows that
  // weren't loaded with the Animal include.
  static async mapIdsToTypes(
    ids: string[],
  ): Promise<Record<string, ANIMAL_TYPE>> {
    if (ids.length === 0) return {};
    const rows = await AnimalModel.findAll({
      where: { id: { [Op.in]: ids } },
    });
    const out: Record<string, ANIMAL_TYPE> = {};
    for (const r of rows) out[r.id] = r.animalType;
    return out;
  }

  // Single row per animal type — upsert keeps the admin UX trivial.
  static async upsert(doc: TUpsertAnimal): Promise<AnimalModel> {
    if (!Object.values(ANIMAL_TYPE).includes(doc.animalType))
      throw new Error(`Invalid animal type: ${doc.animalType}`);
    if (doc.pricePerAnimal !== undefined) {
      const p = Number(doc.pricePerAnimal);
      if (!Number.isFinite(p) || p < 0)
        throw new Error("Үнэ 0-ээс багагүй байх ёстой");
    }

    if (doc.yieldPercent !== undefined) {
      const y = Number(doc.yieldPercent);
      if (!Number.isFinite(y) || y <= 0 || y > 100)
        throw new Error("Гарц 0-100 хооронд байх ёстой");
    }

    const existing = await AnimalModel.findOne({
      where: { animalType: doc.animalType },
    });
    if (existing) {
      if (doc.pricePerAnimal !== undefined)
        existing.pricePerAnimal = Number(doc.pricePerAnimal);
      if (typeof doc.canCoverSlaughterCost === "boolean")
        existing.canCoverSlaughterCost = doc.canCoverSlaughterCost;
      if (doc.yieldPercent !== undefined)
        existing.yieldPercent = Number(doc.yieldPercent);
      if (typeof doc.isActive === "boolean") existing.isActive = doc.isActive;
      await existing.save();
      return existing;
    }
    return await AnimalModel.create({
      animalType: doc.animalType,
      pricePerAnimal:
        doc.pricePerAnimal !== undefined ? Number(doc.pricePerAnimal) : 0,
      canCoverSlaughterCost: !!doc.canCoverSlaughterCost,
      yieldPercent:
        doc.yieldPercent !== undefined
          ? Number(doc.yieldPercent)
          : doc.animalType === ANIMAL_TYPE.HORSE
            ? 70
            : 100,
      isActive: doc.isActive ?? true,
    });
  }

  // Pre-fill defaults for a settlement: defaultCost[type] = price × count.
  static async defaultsForCounts(
    counts: Record<string, number>,
  ): Promise<Record<string, number>> {
    const all = await AnimalModel.findAll({ where: { isActive: true } });
    const map: Record<string, number> = {};
    for (const row of all) {
      const cnt = counts[row.animalType] ?? 0;
      if (cnt > 0)
        map[row.animalType] = Number(
          (Number(row.pricePerAnimal) * cnt).toFixed(2),
        );
    }
    return map;
  }
}
