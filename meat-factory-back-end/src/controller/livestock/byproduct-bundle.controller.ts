import { Op } from "sequelize";
import sequelize from "../../config/db-connection";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { ByproductBundleModel } from "../../models/livestock/byproduct-bundle.model";
import { ByproductWrapperModel } from "../../models/livestock/byproduct-wrapper.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { RegistrationController } from "./registration.controller";
import {
  isPreButchered,
  REGISTRATION_STATUS,
} from "../../types/livestock/registration.type";
import {
  TByproductBundleInput,
  TByproductBundleView,
} from "../../types/livestock/byproduct-bundle.type";
import { TStockLine } from "../../types/inventory/inventory.type";
import { PRODUCT_TYPE } from "../../types/sales/sales-transaction.type";
import { TContext } from "../../types/global/global.type";
import { ADMIN_ROLE, FACTORY } from "../../types/user/admin.type";

// Incoming byproducts (Дайвар) — sub-domain of the registration aggregate.
// Intake is гэдэс COUNT only, one bundle row per wrapper: count received, how
// many the herder takes back, price credited for the rest. Organ kg (элэг,
// бөөр, …) is only known once FACTORY_3 disassembles and weighs a batch
// (ByproductProcessingController).
export class ByproductBundleController {
  // Saved bundle rows, or — before the first save — one default row per
  // active wrapper of each animal on the registration (count = head count,
  // factory keeps all, current price).
  static async bundlesFor(
    registrationId: string,
  ): Promise<TByproductBundleView[]> {
    const saved = await ByproductBundleModel.findAll({
      where: { registrationId },
      include: [
        {
          model: ByproductWrapperModel,
          as: "wrapper",
          include: [{ model: AnimalModel, as: "animal" }],
        },
      ],
    });
    const rows: TByproductBundleView[] =
      saved.length > 0
        ? saved.map((b) => ({
            id: b.id,
            wrapperId: b.wrapperId,
            wrapperName: b.wrapper?.name ?? "",
            animalId: b.wrapper?.animalId ?? "",
            animalType: b.wrapper?.animal?.name ?? "",
            count: b.count,
            herderCount: b.herderCount,
            unitPrice: Number(b.unitPrice),
          }))
        : await this._defaultBundles(registrationId);
    return rows.sort(
      (a, b) =>
        a.animalType.localeCompare(b.animalType) ||
        a.wrapperName.localeCompare(b.wrapperName),
    );
  }

  private static async _defaultBundles(
    registrationId: string,
  ): Promise<TByproductBundleView[]> {
    const lines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId },
    });
    const countByAnimal = new Map(lines.map((l) => [l.animalId, l.count]));
    if (countByAnimal.size === 0) return [];
    const wrappers = await ByproductWrapperModel.findAll({
      where: {
        isActive: true,
        animalId: { [Op.in]: Array.from(countByAnimal.keys()) },
      },
      include: [{ model: AnimalModel, as: "animal" }],
    });
    return wrappers.map((w) => ({
      id: null,
      wrapperId: w.id,
      wrapperName: w.name,
      animalId: w.animalId,
      animalType: w.animal?.name ?? "",
      count: countByAnimal.get(w.animalId) ?? 0,
      herderCount: 0,
      unitPrice: Number(w.price),
    }));
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
    factory: FACTORY,
  ): Promise<TStockLine[]> {
    const bundles = await this.bundlesFor(registrationId);
    return bundles.map((b) => ({
      factory,
      productType: PRODUCT_TYPE.BYPRODUCT,
      animalId: b.animalId,
      byproductName: b.wrapperName,
      quantityKg: 0,
      quantityCount: b.count - b.herderCount,
    }));
  }

  // Replace this registration's bundles.
  //   FACTORY_1 — after VERIFIED, before the settlement locks the amounts
  //     (the herder's take decides the credit).
  //   FACTORY_2 — while REGISTERED (receiving); the herder never takes any
  //     back. finishWeighing stocks what's recorded.
  static async setBundles(
    registrationId: string,
    bundles: TByproductBundleInput[],
    context: TContext,
  ): Promise<void> {
    const reg = await RegistrationController.findIdCheck(
      registrationId,
      context,
    );
    const pre = isPreButchered(reg);
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.ADMIN,
    ]);
    RegistrationController.assertStatus(reg, [
      pre ? REGISTRATION_STATUS.REGISTERED : REGISTRATION_STATUS.VERIFIED,
    ]);

    const rows = await this._validateBundles(registrationId, bundles, pre);
    await sequelize.transaction(async (t) => {
      await ByproductBundleModel.destroy({
        where: { registrationId },
        transaction: t,
      });
      await ByproductBundleModel.bulkCreate(rows, { transaction: t });
    });
  }

  private static async _validateBundles(
    registrationId: string,
    bundles: TByproductBundleInput[],
    pre: boolean,
  ) {
    const lines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId },
    });
    const animalIds = new Set(lines.map((l) => l.animalId));
    const wrappers = await ByproductWrapperModel.findAll({
      where: { id: { [Op.in]: bundles.map((b) => b.wrapperId) } },
    });
    const wrapperById = new Map(wrappers.map((w) => [w.id, w]));
    const seen = new Set<string>();
    return bundles.map((b) => {
      const w = wrapperById.get(b.wrapperId);
      if (!w || !animalIds.has(w.animalId))
        throw new Error("Гэдэс энэ бүртгэлийн малд хамаарахгүй байна");
      if (seen.has(b.wrapperId)) throw new Error(`Давхардсан гэдэс: ${w.name}`);
      seen.add(b.wrapperId);
      const count = Math.floor(Number(b.count));
      const herderCount = pre ? 0 : Math.floor(Number(b.herderCount ?? 0));
      if (!Number.isFinite(count) || count < 0)
        throw new Error("Гэдэсний тоо сөрөг байж болохгүй");
      if (!Number.isFinite(herderCount) || herderCount < 0 || herderCount > count)
        throw new Error(`${w.name}: малчны авах тоо 0–${count} байх ёстой`);
      return {
        registrationId,
        wrapperId: w.id,
        count,
        herderCount,
        unitPrice: Number(w.price),
      };
    });
  }
}
