import { AdminController } from "../user/admin.controller";
import { PERMISSION } from "../../types/user/permission.type";
import {
  FACTORY_BYPRODUCT_INCLUDE,
  FactoryController,
} from "../factory/factory.controller";
import sequelize from "../../config/db-connection";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { ByproductBundleModel } from "../../models/livestock/byproduct-bundle.model";
import { FactoryByproductModel } from "../../models/factory/factory-byproduct.model";
import { RegistrationController } from "./registration.controller";
import {
  REGISTRATION_STATUS,
} from "../../types/livestock/registration.type";
import {
  TByproductBundleInput,
  TByproductBundleView,
} from "../../types/livestock/byproduct-bundle.type";
import { TStockLine } from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { TContext } from "../../types/global/global.type";

// Wrapper or item row (bundle / price list) → its name + the wrapper that
// ties it to an animal.
type TPriced = Pick<FactoryByproductModel, "wrapper" | "constant">;
const describe = (r: TPriced) => ({
  name: r.wrapper?.name ?? r.constant?.name ?? "",
  wrapper: r.wrapper ?? r.constant?.wrapper,
});

// Incoming byproducts (Дайвар) — sub-domain of the registration aggregate.
// Intake is COUNT only and rows come from the site's price list
// (FactoryController.byproducts): LIVE_SLAUGHTER counts whole гэдэс and the
// herder may take some back; PRE_BUTCHERED counts the individual items it
// receives, at a price the receiver may change. Organ kg of гэдэс is only
// known once the byproduct site disassembles a batch
// (ByproductProcessingController).
export class ByproductBundleController {
  // Saved bundle rows, or — before the first save — one default row per
  // price-list entry of each animal on the registration (count = head count
  // × items per head, factory keeps all, list price).
  static async bundlesFor(
    registrationId: string,
  ): Promise<TByproductBundleView[]> {
    const saved = await ByproductBundleModel.findAll({
      where: { registrationId },
      include: FACTORY_BYPRODUCT_INCLUDE,
    });
    const rows: TByproductBundleView[] =
      saved.length > 0
        ? saved.map((b) => {
            const { name, wrapper } = describe(b);
            return {
              id: b.id,
              wrapperId: b.wrapperId,
              constantId: b.constantId,
              name,
              animalId: wrapper?.animalId ?? "",
              animalType: wrapper?.animal?.name ?? "",
              count: b.count,
              herderCount: b.herderCount,
              unitPrice: Number(b.unitPrice),
            };
          })
        : await this._defaultBundles(registrationId);
    return rows.sort(
      (a, b) =>
        a.animalType.localeCompare(b.animalType) ||
        a.name.localeCompare(b.name),
    );
  }

  private static async _defaultBundles(
    registrationId: string,
  ): Promise<TByproductBundleView[]> {
    const lines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId },
    });
    const heads = new Map(lines.map((l) => [l.animalId, l.count]));
    if (heads.size === 0) return [];
    const reg = await RegistrationModel.findByPk(registrationId, {
      attributes: ["factory"],
    });
    const factory = reg?.factory ?? "";
    // PRE_BUTCHERED byproducts arrive independently of the meat: the whole
    // site list, count 0.
    const pre = FactoryController.isPreButchered(factory);
    const list = await this._priceList(factory);
    return list.flatMap((p) => {
      const { name, wrapper } = describe(p);
      if (!wrapper || (!pre && !heads.has(wrapper.animalId))) return [];
      return [
        {
          id: null,
          wrapperId: p.wrapperId,
          constantId: p.constantId,
          name,
          animalId: wrapper.animalId,
          animalType: wrapper.animal?.name ?? "",
          count:
            (heads.get(wrapper.animalId) ?? 0) *
            (p.constant?.quantityPerAnimal ?? 1),
          herderCount: 0,
          unitPrice: Number(p.price),
        },
      ];
    });
  }

  // The site's price-list entries whose catalogue rows are still active.
  private static async _priceList(
    factory: string,
  ): Promise<FactoryByproductModel[]> {
    const rows = await FactoryByproductModel.findAll({
      where: { factory },
      include: FACTORY_BYPRODUCT_INCLUDE,
    });
    return rows.filter(
      (r) => describe(r).wrapper?.isActive && (r.constant?.isActive ?? true),
    );
  }

  // Price credited to the herder per animal = Σ kept bundles × unit price.
  static byproductAmountByAnimal(
    bundles: TByproductBundleView[],
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (const b of bundles)
      out[b.animalId] =
        (out[b.animalId] ?? 0) + (b.count - b.herderCount) * b.unitPrice;
    return out;
  }

  // Kept bundles → stock lines, counted in pieces (SKU per wrapper name).
  static async bundleStockLines(
    registrationId: string,
    factory: string,
  ): Promise<TStockLine[]> {
    const bundles = await this.bundlesFor(registrationId);
    return bundles.map((b) => ({
      factory,
      productType: PRODUCT_TYPE.BYPRODUCT,
      animalId: b.animalId,
      byproductName: b.name,
      quantityKg: 0,
      quantityCount: b.count - b.herderCount,
    }));
  }

  // Replace this registration's bundles.
  //   LIVE_SLAUGHTER — at verify (WEIGHED: the herder decides, per priced
  //     wrapper, how many to take) and correctable after VERIFIED, until the
  //     settlement locks the amounts (the herder's take decides the credit).
  //   PRE_BUTCHERED — while REGISTERED (receiving); the herder never takes
  //     any back. finishWeighing stocks what's recorded.
  static async setBundles(
    registrationId: string,
    bundles: TByproductBundleInput[],
    context: TContext,
  ): Promise<void> {
    const reg = await RegistrationController.findIdCheck(
      registrationId,
      context,
    );
    const pre = FactoryController.isPreButchered(reg.factory);
    AdminController.assertPermission(context, PERMISSION.REGISTRATION_WEIGH);
    RegistrationController.assertStatus(
      reg,
      pre
        ? [REGISTRATION_STATUS.REGISTERED]
        : [REGISTRATION_STATUS.WEIGHED, REGISTRATION_STATUS.VERIFIED],
    );

    const { rows, newAnimalIds } = await this._validateBundles(
      registrationId,
      reg.factory,
      bundles,
      pre,
    );
    await sequelize.transaction(async (t) => {
      await ByproductBundleModel.destroy({
        where: { registrationId },
        transaction: t,
      });
      await ByproductBundleModel.bulkCreate(rows, { transaction: t });
      // PRE_BUTCHERED: a byproduct of an animal with no meat line gets a
      // 0-head line — settlement lines (and their byproduct credit) are per
      // animal line. ponytail: never removed if its count drops back to 0;
      // it just settles at 0₮.
      await RegistrationAnimalLineModel.bulkCreate(
        newAnimalIds.map((animalId) => ({
          registrationId,
          animalId,
          count: 0,
          slaughterCost: 0,
        })),
        { transaction: t },
      );
    });
  }

  private static async _validateBundles(
    registrationId: string,
    factory: string,
    bundles: TByproductBundleInput[],
    pre: boolean,
  ) {
    const lines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId },
    });
    // One bundle per slaughtered head at most (LIVE_SLAUGHTER).
    const heads = new Map(lines.map((l) => [l.animalId, l.count]));
    // Only what the site's price list holds (wrapper or item rows).
    const list = await this._priceList(factory);
    const byKey = new Map(list.map((p) => [p.constantId ?? p.wrapperId, p]));
    const seen = new Set<string>();
    const newAnimalIds = new Set<string>();
    const rows = bundles.map((b) => {
      const key = b.constantId ?? b.wrapperId ?? "";
      const p = byKey.get(key);
      const { name, wrapper } = p ? describe(p) : { name: "", wrapper: null };
      if (!p || !wrapper || (!pre && !heads.has(wrapper.animalId)))
        throw new Error(
          "Дайвар энэ үйлдвэрийн жагсаалт эсвэл бүртгэлийн малд хамаарахгүй байна",
        );
      if (seen.has(key)) throw new Error(`Давхардсан дайвар: ${name}`);
      seen.add(key);
      const count = Math.floor(Number(b.count));
      const herderCount = pre ? 0 : Math.floor(Number(b.herderCount ?? 0));
      if (!Number.isFinite(count) || count < 0)
        throw new Error(`${name}: тоо сөрөг байж болохгүй`);
      if (!pre && count > (heads.get(wrapper.animalId) ?? 0))
        throw new Error(
          `${name}: тоо төхөөрсөн малын тооноос (${heads.get(wrapper.animalId)}) их байна`,
        );
      if (
        !Number.isFinite(herderCount) ||
        herderCount < 0 ||
        herderCount > count
      )
        throw new Error(`${name}: малчны авах тоо 0–${count} байх ёстой`);
      // PRE_BUTCHERED: the receiver may price at today's market.
      const unitPrice =
        pre && b.unitPrice != null ? Number(b.unitPrice) : Number(p.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0)
        throw new Error(`${name}: үнэ сөрөг байж болохгүй`);
      if (count > 0 && !heads.has(wrapper.animalId))
        newAnimalIds.add(wrapper.animalId);
      return {
        registrationId,
        wrapperId: p.wrapperId,
        constantId: p.constantId,
        count,
        herderCount,
        unitPrice: Number(unitPrice.toFixed(2)),
      };
    });
    return { rows, newAnimalIds: [...newAnimalIds] };
  }
}
