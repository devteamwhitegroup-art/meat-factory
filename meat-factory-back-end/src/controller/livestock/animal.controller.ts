import { Op } from "sequelize";
import { AnimalModel } from "../../models/livestock/animal.model";
import { TAnimal, TUpsertAnimal } from "../../types/livestock/animal.type";

// Animal catalogue (admin-managed). Identity is the unique `name` — the
// ANIMAL_TYPE enum was removed. Workflow rows store animalId (resolved from
// the name); the 4 value tables (inventory/cargo/sale/sales) store the name.
export class AnimalController {
  static async list(): Promise<TAnimal[]> {
    return await AnimalModel.findAll({ order: [["name", "ASC"]] });
  }

  static async findByName(name: string): Promise<AnimalModel | null> {
    return await AnimalModel.findOne({ where: { name: name.trim() } });
  }

  // Resolve an Animal row by name. No auto-create (catalogue is admin-managed),
  // so an unknown name is an error — the FE only ever offers catalogue rows.
  static async resolveByName(name: string): Promise<AnimalModel> {
    const row = await this.findByName(name);
    if (!row) throw new Error(`Малын төрөл олдсонгүй: ${name}`);
    return row;
  }

  // Bulk name → animalId. Throws if any name is missing.
  static async mapNamesToIds(
    names: string[],
  ): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const n of names) {
      const row = await this.resolveByName(n);
      out[n] = row.id;
    }
    return out;
  }

  // Inverse — animalId → name. For reading rows without the Animal include.
  static async mapIdsToNames(
    ids: string[],
  ): Promise<Record<string, string>> {
    if (ids.length === 0) return {};
    const rows = await AnimalModel.findAll({ where: { id: { [Op.in]: ids } } });
    const out: Record<string, string> = {};
    for (const r of rows) out[r.id] = r.name;
    return out;
  }

  // Pre-fill defaults for a settlement: defaultCost[name] = price × count.
  static async defaultsForCounts(
    counts: Record<string, number>,
  ): Promise<Record<string, number>> {
    const all = await AnimalModel.findAll({ where: { isActive: true } });
    const map: Record<string, number> = {};
    for (const row of all) {
      const cnt = counts[row.name] ?? 0;
      if (cnt > 0)
        map[row.name] = Number((Number(row.pricePerAnimal) * cnt).toFixed(2));
    }
    return map;
  }

  // Create (by name) or edit (by id, incl. rename). Single admin entry point.
  static async upsert(doc: TUpsertAnimal): Promise<AnimalModel> {
    const name = (doc.name ?? "").trim();
    if (!name) throw new Error("Малын төрлийн нэр шаардлагатай");
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

    const existing = doc.id
      ? await AnimalModel.findByPk(doc.id)
      : await this.findByName(name);
    if (existing) {
      existing.name = name;
      if (typeof doc.isExport === "boolean") existing.isExport = doc.isExport;
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
      name,
      isExport: !!doc.isExport,
      pricePerAnimal:
        doc.pricePerAnimal !== undefined ? Number(doc.pricePerAnimal) : 0,
      canCoverSlaughterCost: !!doc.canCoverSlaughterCost,
      yieldPercent:
        doc.yieldPercent !== undefined ? Number(doc.yieldPercent) : 100,
      isActive: doc.isActive ?? true,
    });
  }
}
