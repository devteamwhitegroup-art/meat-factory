import { AnimalModel } from "../../models/livestock/animal.model";
import { TAnimal, TUpsertAnimal } from "../../types/livestock/animal.type";
import { round2 } from "../../utils";

// Animal catalogue (admin-managed). Inputs name an animal by its unique
// `name`; every stored row (workflow, stock, cargo, sale lines, sales) keeps
// the animalId, resolved from the name once at entry — so a rename is safe.
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

  // Bulk name → row in one query. Throws on any unknown name.
  static async byNames(names: string[]): Promise<Map<string, AnimalModel>> {
    const wanted = [...new Set(names.map((n) => n.trim()))];
    const rows = wanted.length
      ? await AnimalModel.findAll({ where: { name: wanted } })
      : [];
    const map = new Map(rows.map((r) => [r.name, r]));
    const missing = wanted.find((n) => !map.has(n));
    if (missing) throw new Error(`Малын төрөл олдсонгүй: ${missing}`);
    return map;
  }

  // Bulk name → animalId. Throws if any name is missing.
  static async mapNamesToIds(
    names: string[],
  ): Promise<Record<string, string>> {
    const map = await this.byNames(names);
    return Object.fromEntries([...map].map(([n, r]) => [n, r.id]));
  }

  // GraphQL `animalType` field of any row holding animalId: the joined
  // animal's name (include it to skip the fallback lookup).
  static async nameOf(row: {
    animal?: AnimalModel | null;
    animalId?: string | null;
  }): Promise<string | null> {
    if (row.animal?.name) return row.animal.name;
    if (!row.animalId) return null;
    return (await AnimalModel.findByPk(row.animalId))?.name ?? null;
  }

  // id → catalogue name for display (rows store the FK, GraphQL shows names).
  static async namesById(
    ids: (string | null | undefined)[],
  ): Promise<Map<string, string>> {
    const wanted = [...new Set(ids.filter((i): i is string => !!i))];
    if (!wanted.length) return new Map();
    const rows = await AnimalModel.findAll({
      where: { id: wanted },
      attributes: ["id", "name"],
    });
    return new Map(rows.map((r) => [r.id, r.name]));
  }

  // бой зардал defaults: cost[name] = pricePerAnimal × count. Uses the named
  // rows themselves (was: active rows only → an inactive animal got 0).
  static async defaultsForCounts(
    counts: Record<string, number>,
  ): Promise<Record<string, number>> {
    const rows = await this.byNames(Object.keys(counts));
    return Object.fromEntries(
      Object.entries(counts)
        .filter(([, n]) => n > 0)
        .map(([name, n]) => [
          name,
          round2(Number(rows.get(name.trim())!.pricePerAnimal) * n),
        ]),
    );
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
      if (typeof doc.requiresStamp === "boolean")
        existing.requiresStamp = doc.requiresStamp;
      if (doc.pricePerAnimal !== undefined)
        existing.pricePerAnimal = Number(doc.pricePerAnimal);
      if (doc.yieldPercent !== undefined)
        existing.yieldPercent = Number(doc.yieldPercent);
      if (typeof doc.isActive === "boolean") existing.isActive = doc.isActive;
      await existing.save();
      return existing;
    }
    return await AnimalModel.create({
      name,
      isExport: !!doc.isExport,
      requiresStamp: !!doc.requiresStamp,
      pricePerAnimal:
        doc.pricePerAnimal !== undefined ? Number(doc.pricePerAnimal) : 0,
      yieldPercent:
        doc.yieldPercent !== undefined ? Number(doc.yieldPercent) : 100,
      isActive: doc.isActive ?? true,
    });
  }
}
