import sequelize from "../../config/db-connection";
import { RegistrationAnimalLineModel } from "../../models/livestock/registration-animal-line.model";
import { WeighingEntryModel } from "../../models/livestock/weighing-entry.model";
import { SettlementModel } from "../../models/livestock/settlement.model";
import { SettlementLineModel } from "../../models/livestock/settlement-line.model";
import { SettlementPaymentProofModel } from "../../models/livestock/settlement-payment-proof.model";
import { ByproductLogModel } from "../../models/livestock/byproduct-log.model";
import { VerificationModel } from "../../models/livestock/verification.model";
import { AnimalModel } from "../../models/livestock/animal.model";
import { FileModel } from "../../models/global/file.model";
import { AdminModel } from "../../models/user/admin.model";
import { AnimalController } from "./animal.controller";
import { FileController } from "../global/file.controller";
import { InventoryController } from "../inventory/inventory.controller";
import { RegistrationController } from "./registration.controller";
import { findOrThrow } from "../../utils";
import {
  ANIMAL_TYPE,
  REGISTRATION_STATUS,
} from "../../types/livestock/registration.type";
import {
  TCreateSettlement,
  TRegistrationIngestDTO,
} from "../../types/livestock/settlement.type";
import { TContext } from "../../types/global/global.type";
import { ADMIN_ROLE } from "../../types/user/admin.type";

// Settlement (Няравын тооцоо / Санхүү) — sub-domain of the registration
// aggregate. Shared status/role guards and registration lookups live on
// RegistrationController.
export class SettlementController {
  static async createSettlement(
    doc: TCreateSettlement,
    context: TContext,
  ): Promise<SettlementModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
      ADMIN_ROLE.SCALE,
    ]);

    const reg = await RegistrationController.findIdCheck(doc.registrationId);
    RegistrationController.assertStatus(reg, [REGISTRATION_STATUS.VERIFIED]);

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
      animalLines.map((l) => l.animal?.animalType).filter(Boolean) as string[],
    );
    // Бой зардал captured at weighing (pre-VERIFIED). Used as the default when
    // a settlement line doesn't override it.
    const storedCostByType: Record<string, number> = {};
    for (const al of animalLines)
      if (al.animal?.animalType)
        storedCostByType[al.animal.animalType] = Number(al.slaughterCost);

    if (!doc.lines || doc.lines.length === 0)
      throw new Error("At least one settlement line is required");

    const lineTypes = new Set<ANIMAL_TYPE>();
    for (const l of doc.lines) {
      if (!regTypes.has(l.animalType))
        throw new Error(
          `Settlement line ${l.animalType} is not part of this registration`,
        );
      if (lineTypes.has(l.animalType))
        throw new Error(`Duplicate settlement line: ${l.animalType}`);
      if (l.slaughterCost != null && l.slaughterCost < 0)
        throw new Error("slaughterCost cannot be negative");
      lineTypes.add(l.animalType);
    }
    for (const t of regTypes) {
      if (!lineTypes.has(t as ANIMAL_TYPE))
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
      const t = w.animal?.animalType ?? "";
      const wt = Number(w.weightKg);
      const price = w.pricePerKg != null ? Number(w.pricePerKg) : 0;
      receivedByType[t] = (receivedByType[t] ?? 0) + wt;
      meatByType[t] = (meatByType[t] ?? 0) + wt * price;
    }

    // Map every line's animalType → animalId so we can persist the FK.
    const typeToId = await AnimalController.mapTypesToIds(
      Array.from(lineTypes),
    );

    // Byproducts carry no price here (handed to the downstream factory), so
    // the settlement is meat income − slaughter cost.
    let totalMeatAmount = 0;
    const totalByproductAmount = 0;
    let totalSlaughterCost = 0;

    const lineRows = doc.lines.map((l) => {
      const received = receivedByType[l.animalType] ?? 0;
      const meatAmount = meatByType[l.animalType] ?? 0;
      const avgPrice = received > 0 ? meatAmount / received : 0;
      // Pre-butchered intake: the herder delivered cut meat, so there is no
      // slaughter step on our side. Zero it out regardless of input. Otherwise
      // use the line override, falling back to the cost captured at weighing.
      const slaughterCost = reg.isPreButchered
        ? 0
        : (l.slaughterCost ?? storedCostByType[l.animalType] ?? 0);

      totalMeatAmount += meatAmount;
      totalSlaughterCost += slaughterCost;

      return {
        animalId: typeToId[l.animalType],
        receivedWeightKg: Number(received.toFixed(2)),
        pricePerKg: Number(avgPrice.toFixed(2)),
        meatAmount: Number(meatAmount.toFixed(2)),
        byproductAmount: 0,
        slaughterCost: Number(slaughterCost.toFixed(2)),
      };
    });

    const grossAmount = totalMeatAmount + totalByproductAmount;
    const netPayable = grossAmount - totalSlaughterCost;

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

      // VERIFIED → PAYMENT_PENDING: amounts locked in, waiting for the cash.
      await reg.update(
        { status: REGISTRATION_STATUS.PAYMENT_PENDING },
        { transaction: t },
      );

      return s;
    });

    return (await SettlementModel.findByPk(settlement.id, {
      include: [
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
      ],
    })) as SettlementModel;
  }

  // First (and possibly partial) payout. `heldAmount` is withheld pending
  // medical-number approval:
  //   • medical number approved → pay in full (held forced to 0 → SETTLED).
  //   • not approved → a positive held amount is REQUIRED (can't pay full);
  //     pays netPayable − held now → PARTIALLY_SETTLED, rest released later.
  // Inventory IN runs here regardless (the meat is physically received now).
  static async markSettlementPaid(
    registrationId: string,
    heldAmount: number | null | undefined,
    context: TContext,
  ): Promise<SettlementModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(registrationId);
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
        "Эмнэлгийн дугаар батлагдаагүй тул бүтэн төлбөр хийх боломжгүй. Суутгах дүн оруулна уу.",
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

    // Feed settled output into inventory as IN movements (idempotent).
    //   MEAT: every settlement line with received_weight_kg > 0.
    //   BYPRODUCT: each byproduct log row the factory KEEPS — ownership rule:
    //     canCoverSlaughterCost = false → always factory storage.
    //     canCoverSlaughterCost = true  → factory only if the verifier set
    //       verification.slaughterCoveredByByproduct = true (else herder).
    const lines = await SettlementLineModel.findAll({
      where: { settlementId: settlement.id },
      include: [{ model: AnimalModel, as: "animal" }],
    });
    const byproducts = await ByproductLogModel.findAll({
      where: { registrationId },
    });
    const verification = await VerificationModel.findOne({
      where: { registrationId },
    });
    const slaughterCovered = !!verification?.slaughterCoveredByByproduct;

    const meatLines = lines
      .filter((l) => Number(l.receivedWeightKg) > 0)
      .map((l) => ({
        productType: "MEAT" as const,
        animalType: (l.animal?.animalType ?? null) as ANIMAL_TYPE | null,
        byproductType: null,
        byproductName: null,
        quantityKg: Number(l.receivedWeightKg),
      }));

    const byproductLines = byproducts
      .filter((b) => {
        if (!b.name) return false;
        const kg = Number(b.totalWeightKg ?? 0);
        if (kg <= 0) return false;
        // Ownership rule.
        return !b.canCoverSlaughterCost || slaughterCovered;
      })
      .map((b) => ({
        productType: "BYPRODUCT" as const,
        animalType: null,
        byproductType: null,
        byproductName: b.name as string,
        quantityKg: Number(b.totalWeightKg),
      }));

    const dto: TRegistrationIngestDTO = {
      registrationId,
      settledAt: new Date(),
      lines: [...meatLines, ...byproductLines],
    };
    await InventoryController.ingestFromSettledRegistration(dto);

    return (await SettlementModel.findByPk(settlement.id, {
      include: [
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
      ],
    })) as SettlementModel;
  }

  // Release the withheld portion once the medical number is approved. Pays the
  // remaining held amount and fully settles. Inventory was already ingested at
  // markSettlementPaid (idempotent), so nothing is added here.
  static async releaseSettlementHold(
    registrationId: string,
    context: TContext,
  ): Promise<SettlementModel> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);

    const reg = await RegistrationController.findIdCheck(registrationId);
    RegistrationController.assertStatus(reg, [
      REGISTRATION_STATUS.PARTIALLY_SETTLED,
    ]);
    if (!reg.medicalNumberApproved)
      throw new Error("Эмнэлгийн дугаар батлагдаагүй байна");

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

    return (await SettlementModel.findByPk(settlement.id, {
      include: [
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
      ],
    })) as SettlementModel;
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
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
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

  static async removePaymentProof(
    id: string,
    context: TContext,
  ): Promise<void> {
    RegistrationController.assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN,
    ]);
    const row = await findOrThrow(
      SettlementPaymentProofModel,
      id,
      "Баримт олдсонгүй",
    );
    await row.destroy();
  }
}
