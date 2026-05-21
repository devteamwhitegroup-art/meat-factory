import { Transaction, WhereOptions } from 'sequelize';
import sequelize from '../../config/db-connection';
import { RegistrationModel } from '../../models/livestock/registration.model';
import { RegistrationAnimalLineModel } from '../../models/livestock/registration-animal-line.model';
import { WeighingEntryModel } from '../../models/livestock/weighing-entry.model';
import { ByproductLogModel } from '../../models/livestock/byproduct-log.model';
import { VerificationModel } from '../../models/livestock/verification.model';
import { SettlementModel } from '../../models/livestock/settlement.model';
import { SettlementLineModel } from '../../models/livestock/settlement-line.model';
import { HerderModel } from '../../models/livestock/herder.model';
import { FileModel } from '../../models/global/file.model';
import { AdminModel } from '../../models/user/admin.model';
import {
  ANIMAL_TYPE,
  REGISTRATION_STATUS,
  TCreateRegistration,
  TGetRegistrations
} from '../../types/livestock/registration.type';
import { TCreateWeighingEntry } from '../../types/livestock/weighing-entry.type';
import { TCreateByproductLog } from '../../types/livestock/byproduct-log.type';
import { TVerifyInput } from '../../types/livestock/verification.type';
import { TCreateSettlement } from '../../types/livestock/settlement.type';
import { TContext, TPaginationGeneric } from '../../types/global/global.type';
import { ADMIN_ROLE } from '../../types/user/admin.type';
import { HerderController } from './herder.controller';
import { FileController } from '../global/file.controller';
import { InventoryController } from '../inventory/inventory.controller';
import { TRegistrationIngestDTO } from '../../types/livestock/settlement.type';
import { pagination } from '../../utils';

const REGISTRATION_FULL_INCLUDE = [
  { model: HerderModel, as: 'herder' },
  { model: FileModel, as: 'photo' },
  { model: AdminModel, as: 'guard' },
  { model: RegistrationAnimalLineModel, as: 'animalLines' },
  {
    model: WeighingEntryModel,
    as: 'weighingEntries',
    include: [
      { model: AdminModel, as: 'scaleOperator' },
      { model: FileModel, as: 'photo' }
    ]
  },
  {
    model: ByproductLogModel,
    as: 'byproductLogs',
    include: [
      { model: AdminModel, as: 'loggedBy' },
      { model: FileModel, as: 'photo' }
    ]
  },
  {
    model: VerificationModel,
    as: 'verification',
    include: [
      { model: AdminModel, as: 'firstVerifier' },
      { model: AdminModel, as: 'secondVerifier' },
      { model: FileModel, as: 'photo' }
    ]
  },
  {
    model: SettlementModel,
    as: 'settlement',
    include: [
      { model: SettlementLineModel, as: 'lines' },
      { model: AdminModel, as: 'settledBy' },
      { model: FileModel, as: 'photo' }
    ]
  }
];

export class RegistrationController {
  // ─── Helpers ──────────────────────────────────────────────────────

  static async findIdCheck(id: string): Promise<RegistrationModel> {
    const reg = await RegistrationModel.findByPk(id);
    if (!reg) throw new Error('Registration not found');
    return reg;
  }

  static async getById(id: string): Promise<RegistrationModel> {
    const reg = await RegistrationModel.findByPk(id, {
      include: REGISTRATION_FULL_INCLUDE
    });
    if (!reg) throw new Error('Registration not found');
    return reg;
  }

  private static _assertStatus(
    reg: RegistrationModel,
    allowed: REGISTRATION_STATUS[]
  ): void {
    if (!allowed.includes(reg.status)) {
      throw new Error(
        `Invalid status transition: registration is ${reg.status}`
      );
    }
  }

  private static _assertActorRole(
    context: TContext,
    allowed: ADMIN_ROLE[]
  ): void {
    if (!context || !allowed.includes(context.role)) {
      throw new Error(
        `Forbidden: role ${context?.role} cannot perform this action`
      );
    }
  }

  private static async _nextRegistrationNumber(
    t: Transaction
  ): Promise<number> {
    const [rows] = await sequelize.query(
      "SELECT nextval('registration_number_seq') AS n",
      { transaction: t }
    );
    return Number((rows as Array<{ n: string }>)[0].n);
  }

  // ─── Intake (Харуулын бүртгэл) ────────────────────────────────────

  static async create(
    doc: TCreateRegistration,
    context: TContext
  ): Promise<RegistrationModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.GUARD,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const { herderId, vehicleNumber, stamp, photoFileId, intakeDate } = doc;

    if (!vehicleNumber || !vehicleNumber.trim())
      throw new Error('Vehicle number is required');
    if (!doc.animalLines || doc.animalLines.length === 0)
      throw new Error('At least one animal line is required');

    const seen = new Set<ANIMAL_TYPE>();
    for (const line of doc.animalLines) {
      if (!Object.values(ANIMAL_TYPE).includes(line.animalType))
        throw new Error(`Invalid animal type: ${line.animalType}`);
      if (!line.count || line.count <= 0)
        throw new Error('Animal count must be a positive number');
      if (seen.has(line.animalType))
        throw new Error(`Duplicate animal line: ${line.animalType}`);
      seen.add(line.animalType);
    }

    await HerderController.findIdCheck(herderId);
    if (photoFileId) await FileController.findIdCheck(photoFileId);

    return await sequelize.transaction(async (t) => {
      const registrationNumber = await this._nextRegistrationNumber(t);

      const registration = await RegistrationModel.create(
        {
          registrationNumber,
          herderId,
          vehicleNumber: vehicleNumber.trim(),
          stamp: stamp ?? null,
          photoFileId: photoFileId ?? null,
          intakeDate: intakeDate ?? new Date(),
          guardId: context.id,
          status: REGISTRATION_STATUS.REGISTERED
        },
        { transaction: t }
      );

      await RegistrationAnimalLineModel.bulkCreate(
        doc.animalLines.map((l) => ({
          registrationId: registration.id,
          animalType: l.animalType,
          count: l.count
        })),
        { transaction: t }
      );

      return registration;
    }).then((r) => this.getById(r.id));
  }

  static async list(
    doc: TGetRegistrations
  ): Promise<TPaginationGeneric<RegistrationModel>> {
    const { offset, limit } = pagination(doc);
    const where: WhereOptions = {};
    if (doc.status) Object.assign(where, { status: doc.status });
    if (doc.herderId) Object.assign(where, { herderId: doc.herderId });
    if (doc.registrationNumber)
      Object.assign(where, { registrationNumber: doc.registrationNumber });

    return await RegistrationModel.findAndCountAll({
      where,
      include: [
        { model: HerderModel, as: 'herder' },
        { model: RegistrationAnimalLineModel, as: 'animalLines' }
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
  }

  // ─── Weighing (Хэмжүүр) ───────────────────────────────────────────

  static async addWeighingEntry(
    doc: TCreateWeighingEntry,
    context: TContext
  ): Promise<WeighingEntryModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.SCALE,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const { registrationId, animalType, weightKg } = doc;
    if (!Object.values(ANIMAL_TYPE).includes(animalType))
      throw new Error(`Invalid animal type: ${animalType}`);
    if (!weightKg || weightKg <= 0)
      throw new Error('Weight must be a positive number');

    const reg = await this.findIdCheck(registrationId);
    this._assertStatus(reg, [
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.WEIGHING
    ]);

    const line = await RegistrationAnimalLineModel.findOne({
      where: { registrationId, animalType }
    });
    if (!line)
      throw new Error(
        `Animal type ${animalType} is not part of this registration`
      );

    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    return await sequelize.transaction(async (t) => {
      const maxSeq: number =
        ((await WeighingEntryModel.max('sequenceNo', {
          where: { registrationId },
          transaction: t
        })) as number | null) ?? 0;

      const entry = await WeighingEntryModel.create(
        {
          registrationId,
          animalType,
          weightKg,
          sequenceNo: maxSeq + 1,
          scaleOperatorId: context.id,
          photoFileId: doc.photoFileId ?? null
        },
        { transaction: t }
      );

      if (reg.status === REGISTRATION_STATUS.REGISTERED) {
        await reg.update(
          { status: REGISTRATION_STATUS.WEIGHING },
          { transaction: t }
        );
      }

      return entry;
    });
  }

  static async finishWeighing(
    registrationId: string,
    context: TContext
  ): Promise<RegistrationModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.SCALE,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const reg = await this.findIdCheck(registrationId);
    this._assertStatus(reg, [REGISTRATION_STATUS.WEIGHING]);

    const count = await WeighingEntryModel.count({ where: { registrationId } });
    if (count === 0)
      throw new Error('Cannot finish weighing with no entries recorded');

    await reg.update({ status: REGISTRATION_STATUS.WEIGHED });
    return this.getById(registrationId);
  }

  // ─── Byproduct (Дайвар) ───────────────────────────────────────────

  static async addByproductLog(
    doc: TCreateByproductLog,
    context: TContext
  ): Promise<ByproductLogModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const { registrationId, byproductType, count, averageWeightKg } = doc;
    if (!count || count <= 0)
      throw new Error('Count must be a positive number');
    if (!averageWeightKg || averageWeightKg <= 0)
      throw new Error('Average weight must be a positive number');

    const reg = await this.findIdCheck(registrationId);
    this._assertStatus(reg, [REGISTRATION_STATUS.WEIGHED]);

    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    return await ByproductLogModel.create({
      registrationId,
      byproductType,
      count,
      averageWeightKg,
      totalWeightKg: Number((count * averageWeightKg).toFixed(2)),
      loggedById: context.id,
      photoFileId: doc.photoFileId ?? null
    });
  }

  // ─── Verification (Баталгаажуулалт — two distinct staff) ──────────

  static async verify(
    doc: TVerifyInput,
    context: TContext
  ): Promise<VerificationModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.SCALE,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const reg = await this.findIdCheck(doc.registrationId);
    this._assertStatus(reg, [REGISTRATION_STATUS.WEIGHED]);

    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    const [verification] = await VerificationModel.findOrCreate({
      where: { registrationId: doc.registrationId },
      defaults: {
        registrationId: doc.registrationId,
        notes: doc.notes ?? null,
        photoFileId: doc.photoFileId ?? null
      }
    });

    // Attach a photo if provided and not already stamped.
    if (doc.photoFileId && !verification.photoFileId) {
      verification.photoFileId = doc.photoFileId;
    }

    if (!verification.firstVerifierId) {
      verification.firstVerifierId = context.id;
      verification.firstVerifiedAt = new Date();
      if (doc.notes) verification.notes = doc.notes;
      await verification.save();
      return verification;
    }

    if (!verification.secondVerifierId) {
      if (verification.firstVerifierId === context.id) {
        throw new Error(
          'Second verifier must be a different staff member'
        );
      }
      verification.secondVerifierId = context.id;
      verification.secondVerifiedAt = new Date();
      if (doc.notes) verification.notes = doc.notes;
      await verification.save();
      await reg.update({ status: REGISTRATION_STATUS.VERIFIED });
      return verification;
    }

    throw new Error('Registration is already fully verified');
  }

  // ─── Settlement (Няравын тооцоо / Санхүү) ─────────────────────────

  static async createSettlement(
    doc: TCreateSettlement,
    context: TContext
  ): Promise<SettlementModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const reg = await this.findIdCheck(doc.registrationId);
    this._assertStatus(reg, [REGISTRATION_STATUS.VERIFIED]);

    const existing = await SettlementModel.findOne({
      where: { registrationId: doc.registrationId }
    });
    if (existing) throw new Error('Settlement already exists');

    if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);

    const animalLines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId: doc.registrationId }
    });
    const regTypes = new Set(animalLines.map((l) => l.animalType));

    if (!doc.lines || doc.lines.length === 0)
      throw new Error('At least one settlement line is required');

    const lineTypes = new Set<ANIMAL_TYPE>();
    for (const l of doc.lines) {
      if (!regTypes.has(l.animalType))
        throw new Error(
          `Settlement line ${l.animalType} is not part of this registration`
        );
      if (lineTypes.has(l.animalType))
        throw new Error(`Duplicate settlement line: ${l.animalType}`);
      if (!l.pricePerKg || l.pricePerKg <= 0)
        throw new Error('pricePerKg must be a positive number');
      if (l.slaughterCost != null && l.slaughterCost < 0)
        throw new Error('slaughterCost cannot be negative');
      lineTypes.add(l.animalType);
    }
    for (const t of regTypes) {
      if (!lineTypes.has(t))
        throw new Error(`Missing settlement line for animal type ${t}`);
    }

    // Received weight per animal type (sum of weighing entries).
    const weighing = await WeighingEntryModel.findAll({
      where: { registrationId: doc.registrationId }
    });
    const receivedByType: Record<string, number> = {};
    for (const w of weighing) {
      receivedByType[w.animalType] =
        (receivedByType[w.animalType] ?? 0) + Number(w.weightKg);
    }
    const totalReceived = Object.values(receivedByType).reduce(
      (a, b) => a + b,
      0
    );

    // Total byproduct weight for the whole registration.
    const byproducts = await ByproductLogModel.findAll({
      where: { registrationId: doc.registrationId }
    });
    const byproductTotalWeight = byproducts.reduce(
      (a, b) => a + Number(b.totalWeightKg),
      0
    );

    let totalMeatAmount = 0;
    let totalByproductAmount = 0;
    let totalSlaughterCost = 0;

    const lineRows = doc.lines.map((l) => {
      const received = receivedByType[l.animalType] ?? 0;
      const meatAmount = received * l.pricePerKg;
      const allocatedByproduct =
        totalReceived > 0
          ? byproductTotalWeight * (received / totalReceived)
          : 0;
      const byproductAmount =
        allocatedByproduct * (l.byproductPricePerKg ?? 0);
      const slaughterCost = l.slaughterCost ?? 0;

      totalMeatAmount += meatAmount;
      totalByproductAmount += byproductAmount;
      totalSlaughterCost += slaughterCost;

      return {
        animalType: l.animalType,
        receivedWeightKg: Number(received.toFixed(2)),
        pricePerKg: l.pricePerKg,
        meatAmount: Number(meatAmount.toFixed(2)),
        byproductAmount: Number(byproductAmount.toFixed(2)),
        slaughterCost: Number(slaughterCost.toFixed(2))
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
          isPaid: false,
          paidAt: null,
          notes: doc.notes ?? null,
          photoFileId: doc.photoFileId ?? null
        },
        { transaction: t }
      );

      await SettlementLineModel.bulkCreate(
        lineRows.map((r) => ({ ...r, settlementId: s.id })),
        { transaction: t }
      );

      return s;
    });

    return (await SettlementModel.findByPk(settlement.id, {
      include: [{ model: SettlementLineModel, as: 'lines' }]
    })) as SettlementModel;
  }

  static async markSettlementPaid(
    registrationId: string,
    context: TContext
  ): Promise<SettlementModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const reg = await this.findIdCheck(registrationId);
    this._assertStatus(reg, [REGISTRATION_STATUS.VERIFIED]);

    const settlement = await SettlementModel.findOne({
      where: { registrationId }
    });
    if (!settlement) throw new Error('Settlement not found');
    if (settlement.isPaid) throw new Error('Settlement already paid');

    await settlement.update({
      isPaid: true,
      paidAt: new Date(),
      settledById: context.id
    });
    await reg.update({ status: REGISTRATION_STATUS.SETTLED });

    // Feed settled output into inventory as IN movements (idempotent).
    const lines = await SettlementLineModel.findAll({
      where: { settlementId: settlement.id }
    });
    const byproducts = await ByproductLogModel.findAll({
      where: { registrationId }
    });
    const byproductByType: Record<string, number> = {};
    for (const b of byproducts) {
      byproductByType[b.byproductType] =
        (byproductByType[b.byproductType] ?? 0) + Number(b.totalWeightKg);
    }
    const dto: TRegistrationIngestDTO = {
      registrationId,
      settledAt: new Date(),
      lines: [
        ...lines
          .filter((l) => Number(l.receivedWeightKg) > 0)
          .map((l) => ({
            productType: 'MEAT' as const,
            animalType: l.animalType,
            byproductType: null,
            quantityKg: Number(l.receivedWeightKg)
          })),
        ...Object.entries(byproductByType)
          .filter(([, qty]) => qty > 0)
          .map(([byproductType, qty]) => ({
            productType: 'BYPRODUCT' as const,
            animalType: null,
            byproductType,
            quantityKg: qty
          }))
      ]
    };
    await InventoryController.ingestFromSettledRegistration(dto);

    return (await SettlementModel.findByPk(settlement.id, {
      include: [{ model: SettlementLineModel, as: 'lines' }]
    })) as SettlementModel;
  }

  static async cancel(
    registrationId: string,
    context: TContext
  ): Promise<RegistrationModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const reg = await this.findIdCheck(registrationId);
    this._assertStatus(reg, [
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.WEIGHING
    ]);

    await reg.update({ status: REGISTRATION_STATUS.CANCELLED });
    return this.getById(registrationId);
  }
}
