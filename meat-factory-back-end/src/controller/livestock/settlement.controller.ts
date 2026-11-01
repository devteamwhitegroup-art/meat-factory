import { Includeable, Transaction, WhereOptions } from "sequelize";
import { PERMISSION } from "../../types/user/permission.type";
import { FactoryController } from "../factory/factory.controller";
import sequelize from "../../config/db-connection";
import { RegistrationModel } from "../../models/livestock/registration.model";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { SettlementLineModel } from "../../models/livestock/settlement-line.model";
import { SettlementPaymentProofModel } from "../../models/livestock/settlement-payment-proof.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { HerderModel } from "../../models/livestock/herder.model";
import { FileModel } from "../../models/global/file.model";
import { AdminModel } from "../../models/user/admin.model";
import { FileController } from "../global/file.controller";
import { InventoryController } from "../inventory/inventory.controller";
import { RegistrationController } from "./registration.controller";
import { ByproductBundleController } from "./byproduct-bundle.controller";
import { WeighingController } from "./weighing.controller";
import { AdminController } from "../user/admin.controller";
import { dateRangeWhere, findOrThrow, listPaginated, round2 } from "../../utils";
import { REGISTRATION_STATUS } from "../../types/livestock/registration.type";
import {
  TCreateSettlement,
  TGetSettlements,
} from "../../types/livestock/settlement.type";
import { MOVEMENT_SOURCE } from "../../types/inventory/inventory.type";
import { TContext, TPaginationGeneric } from "../../types/global/global.type";

// Settlement (Няравын тооцоо / Санхүү) — sub-domain of the registration
// aggregate. Status/permission rules: RegistrationController.blocker.

// The settlement with everything its screens and receipt show. A function:
// Sequelize mutates include objects, so each read (and the registration
// detail, which nests it) builds fresh ones.
export const SETTLEMENT_INCLUDE = (): Includeable[] => [
  {
    model: SettlementLineModel,
    as: "lines",
    separate: true,
    include: [{ model: AnimalModel, as: "animal" }],
  },
  {
    model: SettlementPaymentProofModel,
    as: "paymentProofs",
    separate: true,
    order: [["sequenceNo", "ASC"]],
    include: [
      { model: FileModel, as: "file" },
      { model: AdminModel, as: "createdBy" },
    ],
  },
  { model: AdminModel, as: "settledBy" },
  { model: FileModel, as: "photo" },
  { model: FileModel, as: "storekeeperSignature" },
];

export type TSettlementCalcLine = {
  animalId: string;
  animal?: AnimalModel;
  receivedWeightKg: number;
  pricePerKg: number;
  meatAmount: number;
  byproductAmount: number;
  slaughterCost: number;
};

export type TSettlementCalc = {
  lines: TSettlementCalcLine[];
  totalMeatAmount: number;
  totalByproductAmount: number;
  totalSlaughterCost: number;
  grossAmount: number;
  netPayable: number;
  // Live intake whose гэдэс take isn't recorded yet: no credit included and
  // the settlement can't be created.
  byproductsPending: boolean;
};

export class SettlementController {
  // Re-fetch a settlement with the full include after a mutation (also used
  // by EbarimtController).
  static reload(id: string): Promise<SettlementModel> {
    return findOrThrow(SettlementModel, id, "Settlement not found", {
      include: SETTLEMENT_INCLUDE(),
    });
  }

  // THE settlement formula, one line per animal line of the registration:
  //   meat      = Σ weighed kg × negotiated price
  //   byproduct = kept гэдэс × unit price (only once the counts are saved)
  //   slaughter = the бой зардал snapshotted on the line at intake (0 for
  //               pre-butchered intake)
  // gross = meat + byproduct; net = gross − slaughter. Totals are sums of the
  // rounded lines, so the lines always add up to the totals.
  // Used by createSettlement, the weigh-fix recalculation, the GraphQL
  // `Registration.settlementPreview` and the printed weigh slip.
  static async compute(
    reg: Pick<RegistrationModel, "id" | "factory">,
    t?: Transaction,
  ): Promise<TSettlementCalc> {
    const registrationId = reg.id;
    const [animalLines, weighed, bundles] = await Promise.all([
      RegistrationAnimalLineModel.findAll({
        where: { registrationId },
        include: [{ model: AnimalModel, as: "animal" }],
        transaction: t,
      }),
      WeighingController.totalsByAnimal(registrationId, t),
      ByproductBundleController.bundlesFor(registrationId, t),
    ]);
    // Pre-butchered unsaved defaults count 0, so they credit nothing anyway.
    const byproductsPending =
      FactoryController.rules(reg.factory).liveAnimals &&
      bundles.some((b) => !b.id);
    const credit = byproductsPending
      ? {}
      : ByproductBundleController.byproductAmountByAnimal(bundles);

    const lines = animalLines.map((l) => {
      const w = weighed.get(l.animalId) ?? { kg: 0, amount: 0 };
      return {
        animalId: l.animalId,
        animal: l.animal,
        receivedWeightKg: round2(w.kg),
        pricePerKg: w.kg > 0 ? round2(w.amount / w.kg) : 0,
        meatAmount: round2(w.amount),
        byproductAmount: round2(credit[l.animalId] ?? 0),
        slaughterCost: round2(Number(l.slaughterCost)),
      };
    });
    const sum = (k: "meatAmount" | "byproductAmount" | "slaughterCost") =>
      round2(lines.reduce((acc, l) => acc + l[k], 0));
    const totalMeatAmount = sum("meatAmount");
    const totalByproductAmount = sum("byproductAmount");
    const totalSlaughterCost = sum("slaughterCost");
    const grossAmount = round2(totalMeatAmount + totalByproductAmount);
    return {
      lines,
      totalMeatAmount,
      totalByproductAmount,
      totalSlaughterCost,
      grossAmount,
      netPayable: round2(grossAmount - totalSlaughterCost),
      byproductsPending,
    };
  }

  // The calc as Settlement / SettlementLine column values.
  private static _amounts({ lines, byproductsPending: _, ...totals }: TSettlementCalc) {
    return { totals, lines: lines.map(({ animal: _a, ...l }) => l) };
  }

  // Weights were fixed after the settlement was created (not yet paid —
  // payout freezes weighing): rebuild its totals and lines in the fix's
  // transaction so the payout always matches the weigh record.
  static async recompute(reg: RegistrationModel, t: Transaction): Promise<void> {
    const settlement = await SettlementModel.findOne({
      where: { registrationId: reg.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!settlement) return;
    if (Number(settlement.paidAmount) > 0)
      throw new Error("Төлбөр хийгдсэн тооцоог өөрчлөх боломжгүй");
    const { totals, lines } = this._amounts(await this.compute(reg, t));
    await settlement.update(totals, { transaction: t });
    await SettlementLineModel.destroy({
      where: { settlementId: settlement.id },
      transaction: t,
    });
    await SettlementLineModel.bulkCreate(
      lines.map((l) => ({ ...l, settlementId: settlement.id })),
      { transaction: t },
    );
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
    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    const settlement = await sequelize.transaction(async (t) => {
      const reg = await RegistrationController.lock(
        doc.registrationId,
        context,
        t,
      );
      RegistrationController.assertCan(reg, context, "createSettlement");
      const calc = await this.compute(reg, t);
      // Live intake: the herder's гэдэс take must be recorded first (the
      // defaults assume the factory keeps all).
      if (calc.byproductsPending)
        throw new Error("Эхлээд дайвар (гэдэс) бүртгэнэ үү");

      const { totals, lines } = this._amounts(calc);
      const s = await SettlementModel.create(
        {
          registrationId: reg.id,
          ...totals,
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
        lines.map((l) => ({ ...l, settlementId: s.id })),
        { transaction: t },
      );
      // Amounts locked, waiting for cash.
      await reg.update(
        { status: REGISTRATION_STATUS.PAYMENT_PENDING },
        { transaction: t },
      );
      // Live intake: kept гэдэс enter stock once the herder's take is locked
      // in here (pre-butchered stocked them when weighing finished).
      if (FactoryController.rules(reg.factory).liveAnimals)
        await InventoryController.ingestFromRegistration(
          reg.id,
          MOVEMENT_SOURCE.BYPRODUCT,
          ByproductBundleController.bundleStockLines(
            await ByproductBundleController.bundlesFor(reg.id, t),
            reg.factory,
          ),
          t,
        );
      return s;
    });
    return this.reload(settlement.id);
  }

  // The settlement row of a registration, locked in the caller's transaction.
  private static async _lockSettlement(
    registrationId: string,
    t: Transaction,
  ): Promise<SettlementModel> {
    const s = await SettlementModel.findOne({
      where: { registrationId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!s) throw new Error("Settlement not found");
    if (s.isPaid) throw new Error("Settlement already paid");
    return s;
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
    const id = await sequelize.transaction(async (t) => {
      // Row locks: a double-click or two clerks can't both pay, and a
      // medical-number ruling can't change mid-payment.
      const reg = await RegistrationController.lock(registrationId, context, t);
      RegistrationController.assertCan(reg, context, "pay");
      const settlement = await this._lockSettlement(registrationId, t);

      const net = Number(settlement.netPayable);
      let held = heldAmount != null ? Number(heldAmount) : 0;
      if (!Number.isFinite(held) || held < 0)
        throw new Error("Суутгах дүн сөрөг байж болохгүй");
      held = round2(held);
      if (held > net) throw new Error("Суутгах дүн нийт төлбөрөөс хэтэрсэн");
      if (reg.medicalNumberApproved) {
        // Approved → no reason to hold; pay in full.
        held = 0;
      } else if (held <= 0) {
        throw new Error(
          "Мал эмнэлгийн дугаар батлагдаагүй тул бүтэн төлбөр хийх боломжгүй. Суутгах дүн оруулна уу.",
        );
      }
      const fullyPaid = held === 0;
      await settlement.update(
        {
          heldAmount: held,
          paidAmount: round2(net - held),
          isPaid: fullyPaid,
          paidAt: new Date(),
          settledById: context.id,
        },
        { transaction: t },
      );
      await reg.update(
        {
          status: fullyPaid
            ? REGISTRATION_STATUS.SETTLED
            : REGISTRATION_STATUS.PARTIALLY_SETTLED,
        },
        { transaction: t },
      );
      return settlement.id;
    });
    return this.reload(id);
  }

  // Release the withheld portion once the medical number is approved. Pays the
  // remaining held amount and fully settles. Stock is untouched.
  static async releaseSettlementHold(
    registrationId: string,
    context: TContext,
  ): Promise<SettlementModel> {
    const id = await sequelize.transaction(async (t) => {
      const reg = await RegistrationController.lock(registrationId, context, t);
      RegistrationController.assertCan(reg, context, "releaseHold");
      const settlement = await this._lockSettlement(registrationId, t);
      if (Number(settlement.heldAmount) <= 0)
        throw new Error("Суутгасан дүн алга байна");
      await settlement.update(
        {
          paidAmount: Number(settlement.netPayable),
          isPaid: true,
          heldReleasedAt: new Date(),
          settledById: context.id,
        },
        { transaction: t },
      );
      await reg.update(
        { status: REGISTRATION_STATUS.SETTLED },
        { transaction: t },
      );
      return settlement.id;
    });
    return this.reload(id);
  }

  // Money-flow statement: attach an already-uploaded image (bank transfer
  // screenshot / receipt) to the settlement AFTER a payout has been made.
  static async addPaymentProof(
    registrationId: string,
    fileId: string,
    note: string | null,
    context: TContext,
  ): Promise<SettlementPaymentProofModel> {
    AdminController.assertPermission(context, PERMISSION.SETTLEMENT_PAY);
    const settlement = await this._scoped(registrationId, context);
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
    // Drawn by нягтлан on the receipt — not нярав.
    AdminController.assertPermission(context, PERMISSION.SETTLEMENT_PAY);
    const settlement = await this._scoped(registrationId, context);
    if (fileId) await FileController.findIdCheck(fileId);
    await settlement.update({ storekeeperSignatureFileId: fileId ?? null });
    return this.reload(settlement.id);
  }

  static async removePaymentProof(
    id: string,
    context: TContext,
  ): Promise<void> {
    AdminController.assertPermission(context, PERMISSION.SETTLEMENT_PAY);
    const row = await findOrThrow(
      SettlementPaymentProofModel,
      id,
      "Баримт олдсонгүй",
      { include: [{ model: SettlementModel, as: "settlement" }] },
    );
    await this._scoped(row.settlement!.registrationId, context);
    await row.destroy();
  }

  // A registration's settlement, within the actor's factory.
  private static async _scoped(
    registrationId: string,
    context: TContext,
  ): Promise<SettlementModel> {
    await RegistrationController.findIdCheck(registrationId, context);
    const s = await SettlementModel.findOne({ where: { registrationId } });
    if (!s) throw new Error("Settlement not found");
    return s;
  }
}
