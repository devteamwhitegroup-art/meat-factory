import { FactoryModel } from "../../models/factory/factory.model";
import { FactoryByproductModel } from "../../models/factory/factory-byproduct.model";
import { ByproductWrapperModel } from "../../models/livestock/byproduct-wrapper.model";
import { ByproductConstantModel } from "../../models/livestock/byproduct-constant.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import {
  FACTORY_CODE_RE,
  FACTORY_KIND,
  TCreateFactory,
  TFactory,
  TFactoryByproductView,
  TSetFactoryByproduct,
  TUpdateFactory,
} from "../../types/factory/factory.type";
import { findOrThrow } from "../../utils";

// A site's price list row with what it prices (and that thing's animal).
// Each level needs its own include object — Sequelize mutates them, and a
// shared one breaks the nested join ("missing FROM-clause entry").
const withAnimal = () => [{ model: AnimalModel, as: "animal" }];
export const FACTORY_BYPRODUCT_INCLUDE = [
  { model: ByproductWrapperModel, as: "wrapper", include: withAnimal() },
  {
    model: ByproductConstantModel,
    as: "constant",
    include: [
      { model: ByproductWrapperModel, as: "wrapper", include: withAnimal() },
    ],
  },
];

// Factories are a tiny admin-managed catalogue; business rules branch on
// `kind`. ponytail: the whole table is cached in-process (loaded at boot,
// refreshed after every write) so rule checks stay synchronous and free —
// move to a per-request lookup if this ever runs as more than one instance.
export class FactoryController {
  private static _cache = new Map<string, TFactory>();

  static async load(): Promise<void> {
    const rows = await FactoryModel.findAll({ order: [["createdAt", "ASC"]] });
    this._cache = new Map(rows.map((r) => [r.code, r.get({ plain: true })]));
  }

  // First boot of an empty table: the three sites the client runs today.
  static async seedDefaults(): Promise<void> {
    if ((await FactoryModel.count()) > 0) return;
    await FactoryModel.bulkCreate([
      { code: "FACTORY_1", name: "Урд үйлдвэр", kind: FACTORY_KIND.LIVE_SLAUGHTER },
      { code: "FACTORY_2", name: "Хойд үйлдвэр", kind: FACTORY_KIND.PRE_BUTCHERED },
      { code: "FACTORY_3", name: "Дайвар үйлдвэр", kind: FACTORY_KIND.BYPRODUCT },
    ]);
  }

  static all(includeInactive = false): TFactory[] {
    const list = Array.from(this._cache.values());
    return includeInactive ? list : list.filter((f) => f.isActive);
  }

  static get(code: string): TFactory {
    const f = this._cache.get(code);
    if (!f) throw new Error(`Үйлдвэр олдсонгүй: ${code}`);
    return f;
  }

  static assertActive(code: string): TFactory {
    const f = this.get(code);
    if (!f.isActive) throw new Error(`${f.name}: идэвхгүй үйлдвэр`);
    return f;
  }

  static nameOf(code: string): string {
    return this._cache.get(code)?.name ?? code;
  }

  static kindOf(code: string): FACTORY_KIND {
    return this.get(code).kind;
  }

  static isPreButchered(code: string): boolean {
    return this.kindOf(code) === FACTORY_KIND.PRE_BUTCHERED;
  }

  static isByproduct(code: string): boolean {
    return this.kindOf(code) === FACTORY_KIND.BYPRODUCT;
  }

  static assertKind(code: string, kind: FACTORY_KIND, message: string): void {
    if (this.kindOf(code) !== kind) throw new Error(message);
  }

  // Where counted гэдэс goes when the sender doesn't say: the one active
  // byproduct site. With several, the caller must name one.
  static defaultByproductFactory(): TFactory {
    const sites = this.all().filter((f) => f.kind === FACTORY_KIND.BYPRODUCT);
    if (sites.length === 0) throw new Error("Дайврын үйлдвэр тохируулаагүй байна");
    if (sites.length > 1)
      throw new Error("Хүлээн авах дайврын үйлдвэрийг сонгоно уу");
    return sites[0];
  }

  static async create(doc: TCreateFactory): Promise<FactoryModel> {
    const code = doc.code?.trim().toUpperCase();
    if (!FACTORY_CODE_RE.test(code ?? ""))
      throw new Error(
        "Код: латин том үсэг, тоо, _ (ж: FACTORY_4), 2-32 тэмдэгт",
      );
    if (!doc.name?.trim()) throw new Error("Нэр оруулна уу");
    if (!Object.values(FACTORY_KIND).includes(doc.kind))
      throw new Error("Үйлдвэрийн төрөл сонгоно уу");
    if (this._cache.has(code)) throw new Error("Энэ кодтой үйлдвэр байна");
    const row = await FactoryModel.create({
      code,
      name: doc.name.trim(),
      kind: doc.kind,
    });
    await this.load();
    return row;
  }

  // Kind is fixed at creation: existing registrations/stock were processed
  // under its rules. Rename or (de)activate only.
  static async update(doc: TUpdateFactory): Promise<FactoryModel> {
    const row = await findOrThrow(FactoryModel, doc.code, "Үйлдвэр олдсонгүй");
    if (doc.name !== undefined && doc.name !== null) {
      if (!doc.name.trim()) throw new Error("Нэр оруулна уу");
      row.name = doc.name.trim();
    }
    if (typeof doc.isActive === "boolean") row.isActive = doc.isActive;
    await row.save();
    await this.load();
    return row;
  }

  // ── Byproduct price list ──
  // LIVE_SLAUGHTER prices whole гэдэс (herder may take some back at verify);
  // PRE_BUTCHERED picks the individual items it receives, and the price is
  // only a default the receiver may change per registration.
  static async byproducts(code: string): Promise<TFactoryByproductView[]> {
    this.get(code);
    const rows = await FactoryByproductModel.findAll({
      where: { factory: code },
      include: FACTORY_BYPRODUCT_INCLUDE,
    });
    return rows
      .map((r) => {
        const w = r.wrapper ?? r.constant?.wrapper;
        return {
          id: r.id,
          factory: r.factory,
          wrapperId: r.wrapperId,
          constantId: r.constantId,
          name: r.wrapper?.name ?? r.constant?.name ?? "",
          animalType: w?.animal?.name ?? "",
          price: Number(r.price),
        };
      })
      .sort(
        (a, b) =>
          a.animalType.localeCompare(b.animalType) ||
          a.name.localeCompare(b.name),
      );
  }

  static async setByproduct(
    doc: TSetFactoryByproduct,
  ): Promise<FactoryByproductModel> {
    const kind = this.kindOf(doc.factory);
    const price = Number(doc.price);
    if (!Number.isFinite(price) || price < 0)
      throw new Error("Үнэ сөрөг байж болохгүй");
    let key: { wrapperId: string } | { constantId: string };
    if (kind === FACTORY_KIND.LIVE_SLAUGHTER) {
      if (!doc.wrapperId) throw new Error("Гэдэс сонгоно уу");
      await findOrThrow(ByproductWrapperModel, doc.wrapperId, "Багц олдсонгүй");
      key = { wrapperId: doc.wrapperId };
    } else if (kind === FACTORY_KIND.PRE_BUTCHERED) {
      if (!doc.constantId) throw new Error("Дайвар сонгоно уу");
      await findOrThrow(ByproductConstantModel, doc.constantId, "Дайвар олдсонгүй");
      key = { constantId: doc.constantId };
    } else {
      throw new Error("Дайврын үйлдвэрт үнэ тохируулахгүй");
    }
    const where = { factory: doc.factory, ...key };
    const row =
      (await FactoryByproductModel.findOne({ where })) ??
      FactoryByproductModel.build(where);
    row.price = Number(price.toFixed(2));
    return row.save();
  }

  static async removeByproduct(id: string): Promise<void> {
    const row = await findOrThrow(FactoryByproductModel, id, "Олдсонгүй");
    await row.destroy();
  }
}
