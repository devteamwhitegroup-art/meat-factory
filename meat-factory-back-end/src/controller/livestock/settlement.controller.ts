import { WhereOptions } from "sequelize";
import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { SettlementLineModel } from "../../models/livestock/settlement-line.model";
import { SettlementPaymentProofModel } from "../../models/livestock/settlement-payment-proof.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { HerderModel } from "../../models/livestock/herder.model";
import { FileModel } from "../../models/global/file.model";
import { AdminModel } from "../../models/user/admin.model";
import { AnimalController } from "./animal.controller";
import { FileController } from "../global/file.controller";
import { InventoryController } from "../inventory/inventory.controller";
import { RegistrationController } from "./registration.controller";
import { ByproductBundleController } from "./byproduct-bundle.controller";
import { AdminController } from "../user/admin.controller";
import { dateRangeWhere, findOrThrow, listPaginated } from "../../utils";
import {
  isPreButchered,
  REGISTRATION_STATUS,
} from "../../types/livestock/registration.type";
import {
  TCreateSettlement,
  TGetSettlements,
} from "../../types/livestock/settlement.type";
import { MOVEMENT_SOURCE } from "../../types/inventory/inventory.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";
import { ADMIN_ROLE } from "../../types/user/admin.type";

// Settlement (Няравын тооцоо / Санхүү) — sub-domain of the registration
// aggregate. Shared status/role guards and registration lookups live on
// RegistrationController.

// Full eager-load every mutation returns to the resolver.
const SETTLEMENT_INCLUDE = [
  {
    model: SettlementLineModel,
    as: "lines",
    include: [{ model: AnimalModel, as: "animal" }],
  },
  {
    model: SettlementPaymentProofModel,
    as: "paymentProofs",
    include: [
      { model: FileModel, as: "file" },
      { model: AdminModel, as: "createdBy" },
    ],
  },
  { model: FileModel, as: "storekeeperSignature" },
];

export class SettlementController {
  // Re-fetch a settlement with the full include after a mutation.
  private static _reload(id: string): Promise<SettlementModel> {
    return findOrThrow(SettlementModel, id, "Settlement not found", {
      include: SETTLEMENT_INCLUDE,
    });
  }

  // Herder-side payout list — the "Малчид" tab on /sales, alongside the
  // customer-side SalesTransaction list.
  static async list(
    doc: TGetSettlements,
    context: TContext,
  ): Promise<TPaginationGeneric<SettlementModel>> {
    const where: WhereOptions = {};
    // Loose check: the FE always sends this key (never omits it), using
    // explicit null for "all" — isPaid is NOT NULL, so `!== undefined` would
    // turn "all" into a `WHERE is_paid IS NULL` that matches zero rows.
    if (doc.isPaid != null) Object.assign(where, { isPaid: doc.isPaid });
    Object.assign(where, dateRangeWhere(doc.dateRange, "createdAt"));

    const registrationWhere: WhereOptions = {};
    if (doc.herderId) Object.assign(registrationWhere, { herderId: doc.herderId });
    const factory = AdminController.readFactory(context, doc.factory);
    if (factory) Object.assign(registrationWhere, { factory });

    return listPaginated(SettlementModel, doc, {
      where,
      include: [
        {
          model: RegistrationModel,
          as: "registration",
          where:
            Object.keys(registrationWhere).length > 0
              ? registrationWhere
              : undefined,
          include: [{ model: HerderModel, as: "herder" }],
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  static async createSettlement(
    doc: TCreateSettlement,
    context: TContext,
  ): Promise<SettlementModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.ACCOUNTANT,
      ADMIN_ROLE.ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(
      doc.registrationId,
      context,
    );
    const pre = isPreButchered(reg);
    // FACTORY_1 settles after verify; FACTORY_2 (no verify step) once weighed.
    RegistrationController.assertStatus(reg, [
      pre ? REGISTRATION_STATUS.WEIGHED : REGISTRATION_STATUS.VERIFIED,
    ]);

    const existing = await SettlementModel.findOne({
      where: { registrationId: doc.registrationId },
    });
    if (existing) throw new Error("Settlement already exists");

    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    const animalLines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId: doc.registrationId },
      include: [{ model: AnimalModel, as: "animal" }],
    });
    const regTypes = new Set(
      animalLines.map((l) => l.animal?.name).filter(Boolean) as string[],
    );
    // Бой зардал is fixed: per-head catalogue price × head count, snapshotted
    // on the animal line at intake. Never overridden here.
    const storedCostByType: Record<string, number> = {};
    for (const al of animalLines)
      if (al.animal?.name)
        storedCostByType[al.animal.name] = Number(al.slaughterCost);

    if (!doc.lines || doc.lines.length === 0)
      throw new Error("At least one settlement line is required");

    const lineTypes = new Set<string>();
    for (const l of doc.lines) {
      if (!regTypes.has(l.animalType))
        throw new Error(
          `Settlement line ${l.animalType} is not part of this registration`,
        );
      if (lineTypes.has(l.animalType))
        throw new Error(`Duplicate settlement line: ${l.animalType}`);
      lineTypes.add(l.animalType);
    }
    for (const t of regTypes) {
      if (!lineTypes.has(t))
        throw new Error(`Missing settlement line for animal type ${t}`);
    }

    // Meat income is derived from the per-entry negotiated prices
    // (dynamic pricing): meat = Σ(weighing.weightKg × weighing.pricePerKg).
    // Aggregate by animal *id* (it's what we'll store on each line) and
    // by *type* (it's how the input is keyed).
    const weighing = await WeighingEntryModel.findAll({
      where: { registrationId: doc.registrationId },
      include: [{ model: AnimalModel, as: "animal" }],
    });
    const receivedByType: Record<string, number> = {};
    const meatByType: Record<string, number> = {};
    for (const w of weighing) {
      const t = w.animal?.name ?? "";
      const wt = Number(w.weightKg);
      const price = w.pricePerKg != null ? Number(w.pricePerKg) : 0;
      receivedByType[t] = (receivedByType[t] ?? 0) + wt;
      meatByType[t] = (meatByType[t] ?? 0) + wt * price;
    }

    // Map every line's animal name → animalId so we can persist the FK.
    const typeToId = await AnimalController.mapNamesToIds(
      Array.from(lineTypes),
    );

    // Byproduct credit: every гэдэс the factory keeps is worth its price to
    // the herder (35K бой − 15K гэдэс → herder owes 20K). FACTORY_1 must have
    // recorded the herder's take first — the defaults assume factory keeps all.
    const bundles = await ByproductBundleController.bundlesFor(
      doc.registrationId,
    );
    if (!pre && bundles.length > 0 && bundles[0].id === null)
      throw new Error("Эхлээд дайвар (гэдэс) бүртгэнэ үү");
    const byproductByAnimal =
      ByproductBundleController.byproductAmountByAnimal(bundles);

    let totalMeatAmount = 0;
    let totalByproductAmount = 0;
    let totalSlaughterCost = 0;

    const lineRows = doc.lines.map((l) => {
      const received = receivedByType[l.animalType] ?? 0;
      const meatAmount = meatByType[l.animalType] ?? 0;
      const avgPrice = received > 0 ? meatAmount / received : 0;
      // Pre-butchered intake: the herder delivered cut meat, so there is no
      // slaughter step on our side.
      const slaughterCost = pre ? 0 : (storedCostByType[l.animalType] ?? 0);
      const byproductAmount = byproductByAnimal[typeToId[l.animalType]] ?? 0;

      totalMeatAmount += meatAmount;
      totalByproductAmount += byproductAmount;
      totalSlaughterCost += slaughterCost;

      return {
        animalId: typeToId[l.animalType],
        receivedWeightKg: Number(received.toFixed(2)),
        pricePerKg: Number(avgPrice.toFixed(2)),
        meatAmount: Number(meatAmount.toFixed(2)),
        byproductAmount: Number(byproductAmount.toFixed(2)),
        slaughterCost: Number(slaughterCost.toFixed(2)),
      };
    });

    const grossAmount = totalMeatAmount + totalByproductAmount;
    const netPayable = grossAmount - totalSlaughterCost;

    // FACTORY_1 kept гэдэс (counted) enter stock once the herder's take is
    // locked in by this settlement (FACTORY_2 stocked at finishWeighing).
    const keptBundles = pre
      ? []
      : await ByproductBundleController.bundleStockLines(
          doc.registrationId,
          reg.factory,
        );

    const settlement = await sequelize.transaction(async (t) => {
      const s = await SettlementModel.create(
        {
          registrationId: doc.registrationId,
          totalMeatAmount: Number(totalMeatAmount.toFixed(2)),
          totalByproductAmount: Number(totalByproductAmount.toFixed(2)),
          totalSlaughterCost: Number(totalSlaughterCost.toFixed(2)),
          grossAmount: Number(grossAmount.toFixed(2)),
          netPayable: Number(netPayable.toFixed(2)),
          payoutBankAccount: doc.payoutBankAccount?.trim() || null,
          payoutBankName: doc.payoutBankName?.trim() || null,
          payoutAccountHolderName: doc.payoutAccountHolderName?.trim() || null,
          isPaid: false,
          paidAt: null,
          notes: doc.notes ?? null,
          photoFileId: doc.photoFileId ?? null,
        },
        { transaction: t },
      );

      await SettlementLineModel.bulkCreate(
        lineRows.map((r) => ({ ...r, settlementId: s.id })),
        { transaction: t },
      );

      // VERIFIED/WEIGHED → PAYMENT_PENDING: amounts locked, waiting for cash.
      await reg.update(
        { status: REGISTRATION_STATUS.PAYMENT_PENDING },
        { transaction: t },
      );

      await InventoryController.ingestFromRegistration(
        doc.registrationId,
        MOVEMENT_SOURCE.BYPRODUCT,
        keptBundles,
        t,
      );

      return s;
    });

    return this._reload(settlement.id);
  }

  // First (and possibly partial) payout. `heldAmount` is withheld pending
  // medical-number approval:
  //   • medical number approved → pay in full (held forced to 0 → SETTLED).
  //   • not approved → a positive held amount is REQUIRED (can't pay full);
  //     pays netPayable − held now → PARTIALLY_SETTLED, rest released later.
  // Stock was already ingested (verify / settlement creation / FACTORY_2
  // finishWeighing) — paying moves money only.
  static async markSettlementPaid(
    registrationId: string,
    heldAmount: number | null | undefined,
    context: TContext,
  ): Promise<SettlementModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.ACCOUNTANT,
      ADMIN_ROLE.ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(
      registrationId,
      context,
    );
    // Settlement was created during createSettlement → PAYMENT_PENDING.
    RegistrationController.assertStatus(reg, [
      REGISTRATION_STATUS.PAYMENT_PENDING,
    ]);

    const settlement = await SettlementModel.findOne({
      where: { registrationId },
    });
    if (!settlement) throw new Error("Settlement not found");
    if (settlement.isPaid) throw new Error("Settlement already paid");

    const net = Number(settlement.netPayable);
    let held = heldAmount != null ? Number(heldAmount) : 0;
    if (!Number.isFinite(held) || held < 0)
      throw new Error("Суутгах дүн сөрөг байж болохгүй");
    held = Number(held.toFixed(2));
    if (held > net) throw new Error("Суутгах дүн нийт төлбөрөөс хэтэрсэн");
    if (reg.medicalNumberApproved) {
      // Approved → no reason to hold; pay in full.
      held = 0;
    } else if (held <= 0) {
      throw new Error(
        "Мал эмнэлгийн дугаар батлагдаагүй тул бүтэн төлбөр хийх боломжгүй. Суутгах дүн оруулна уу.",
      );
    }

    const paidNow = Number((net - held).toFixed(2));
    const fullyPaid = held === 0;

    await settlement.update({
      heldAmount: held,
      paidAmount: paidNow,
      isPaid: fullyPaid,
      paidAt: new Date(),
      settledById: context.id,
    });
    await reg.update({
      status: fullyPaid
        ? REGISTRATION_STATUS.SETTLED
        : REGISTRATION_STATUS.PARTIALLY_SETTLED,
    });

    return this._reload(settlement.id);
  }

  // Release the withheld portion once the medical number is approved. Pays the
  // remaining held amount and fully settles. Stock is untouched.
  static async releaseSettlementHold(
    registrationId: string,
    context: TContext,
  ): Promise<SettlementModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.ACCOUNTANT,
      ADMIN_ROLE.ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(
      registrationId,
      context,
    );
    RegistrationController.assertStatus(reg, [
      REGISTRATION_STATUS.PARTIALLY_SETTLED,
    ]);
    if (!reg.medicalNumberApproved)
      throw new Error("Мал эмнэлгийн дугаар батлагдаагүй байна");

    const settlement = await SettlementModel.findOne({
      where: { registrationId },
    });
    if (!settlement) throw new Error("Settlement not found");
    if (settlement.isPaid) throw new Error("Settlement already paid");
    if (Number(settlement.heldAmount) <= 0)
      throw new Error("Суутгасан дүн алга байна");

    await settlement.update({
      paidAmount: Number(settlement.netPayable),
      isPaid: true,
      heldReleasedAt: new Date(),
      settledById: context.id,
    });
    await reg.update({ status: REGISTRATION_STATUS.SETTLED });

    return this._reload(settlement.id);
  }

  // Money-flow statement: attach an already-uploaded image (bank transfer
  // screenshot / receipt) to the settlement AFTER a payout has been made.
  static async addPaymentProof(
    registrationId: string,
    fileId: string,
    note: string | null,
    context: TContext,
  ): Promise<SettlementPaymentProofModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.ACCOUNTANT,
      ADMIN_ROLE.ADMIN,
    ]);

    const settlement = await SettlementModel.findOne({
      where: { registrationId },
    });
    if (!settlement) throw new Error("Settlement not found");
    if (Number(settlement.paidAmount) <= 0)
      throw new Error("Төлбөр хийгдээгүй тул баримт хавсаргах боломжгүй");

    await FileController.findIdCheck(fileId);

    const proof = await sequelize.transaction(async (t) => {
      const maxSeq: number =
        ((await SettlementPaymentProofModel.max("sequenceNo", {
          where: { settlementId: settlement.id },
          transaction: t,
        })) as number | null) ?? 0;
      return await SettlementPaymentProofModel.create(
        {
          settlementId: settlement.id,
          fileId,
          note: note?.trim() || null,
          sequenceNo: maxSeq + 1,
          createdById: context.id,
        },
        { transaction: t },
      );
    });

    return (await SettlementPaymentProofModel.findByPk(proof.id, {
      include: [
        { model: FileModel, as: "file" },
        { model: AdminModel, as: "createdBy" },
      ],
    })) as SettlementPaymentProofModel;
  }

  // Attach the storekeeper's drawn signature (an already-uploaded File) to
  // the settlement receipt. Signed once, reused on every subsequent print —
  // no status gate, since it's the worker's own attestation, not part of the
  // herder consent flow. Pass null to clear.
  static async setStorekeeperSignature(
    registrationId: string,
    fileId: string | null,
    context: TContext,
  ): Promise<SettlementModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.ADMIN,
    ]);

    const settlement = await SettlementModel.findOne({
      where: { registrationId },
    });
    if (!settlement) throw new Error("Settlement not found");

    if (fileId) await FileController.findIdCheck(fileId);
    await settlement.update({ storekeeperSignatureFileId: fileId ?? null });
    return this._reload(settlement.id);
  }

  static async removePaymentProof(
    id: string,
    context: TContext,
  ): Promise<void> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.ACCOUNTANT,
      ADMIN_ROLE.ADMIN,
    ]);
    const row = await findOrThrow(
      SettlementPaymentProofModel,
      id,
      "Баримт олдсонгүй",
    );
    await row.destroy();
  }
}
