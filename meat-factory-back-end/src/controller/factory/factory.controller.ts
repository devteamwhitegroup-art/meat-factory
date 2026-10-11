import { FactoryModel } from "../../models/factory/factory.model";
import {
  FACTORY_CODE_RE,
  FACTORY_KIND,
  TCreateFactory,
  TFactory,
  TUpdateFactory,
} from "../../types/factory/factory.type";
import { findOrThrow } from "../../utils";

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
}
