import { Op, Transaction, WhereOptions } from 'sequelize';
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
import { AnimalModel } from '../../models/livestock/animal.model';
import { AnimalController } from './animal.controller';
import {
  ANIMAL_TYPE,
  REGISTRATION_NUMBER_START,
  REGISTRATION_STATUS,
  TCreateRegistration,
  TGetRegistrations
} from '../../types/livestock/registration.type';
import {
  TCreateWeighingEntry,
  TUpdateWeighingEntry
} from '../../types/livestock/weighing-entry.type';
import { TByproductItemInput } from '../../types/livestock/byproduct-log.type';
import { ByproductConstantController } from './byproduct-constant.controller';
import { TDateRange } from '../../types/dashboard/dashboard.type';
import { TVerifyInput } from '../../types/livestock/verification.type';
import { TCreateSettlement } from '../../types/livestock/settlement.type';
import { TContext, TPaginationGeneric } from '../../types/global/global.type';
import { ADMIN_ROLE } from '../../types/user/admin.type';
import { HerderController } from './herder.controller';
import { FileController } from '../global/file.controller';
import { InventoryController } from '../inventory/inventory.controller';
import { TRegistrationIngestDTO } from '../../types/livestock/settlement.type';
import { pagination } from '../../utils';

// All livestock workflow rows (animal lines, weighing entries, byproduct logs,
// settlement lines) now FK into Animals. We eager-include `animal` everywhere
// we previously read `row.animalType` so the controller stays stateless.
const REGISTRATION_FULL_INCLUDE = [
  { model: HerderModel, as: 'herder' },
  { model: FileModel, as: 'photo' },
  { model: FileModel, as: 'signature' },
  { model: FileModel, as: 'stampImage' },
  { model: AdminModel, as: 'guard' },
  {
    model: RegistrationAnimalLineModel,
    as: 'animalLines',
    include: [{ model: AnimalModel, as: 'animal' }]
  },
  {
    model: WeighingEntryModel,
    as: 'weighingEntries',
    include: [
      { model: AnimalModel, as: 'animal' },
      { model: AdminModel, as: 'scaleOperator' },
      { model: FileModel, as: 'photo' }
    ]
  },
  {
    model: ByproductLogModel,
    as: 'byproductLogs',
    include: [
      { model: AnimalModel, as: 'animal' },
      { model: AdminModel, as: 'loggedBy' },
      { model: FileModel, as: 'photo' }
    ]
  },
  {
    model: VerificationModel,
    as: 'verification',
    include: [
      { model: AdminModel, as: 'firstVerifier' },
      { model: FileModel, as: 'photo' }
    ]
  },
  {
    model: SettlementModel,
    as: 'settlement',
    include: [
      {
        model: SettlementLineModel,
        as: 'lines',
        include: [{ model: AnimalModel, as: 'animal' }]
      },
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

  // Preview the next Бүртгэлийн дугаар WITHOUT consuming the sequence.
  // Informational only (racy); the real number is assigned at create time.
  static async previewNextRegistrationNumber(): Promise<number> {
    try {
      const [rows] = await sequelize.query(
        'SELECT last_value, is_called FROM registration_number_seq'
      );
      const row = (
        rows as Array<{ last_value: string; is_called: boolean }>
      )[0];
      if (!row) return REGISTRATION_NUMBER_START;
      const last = Number(row.last_value);
      return row.is_called ? last + 1 : last;
    } catch {
      return REGISTRATION_NUMBER_START;
    }
  }

  // ─── Intake (Харуулын бүртгэл) ────────────────────────────────────

  static async create(
    doc: TCreateRegistration,
    context: TContext
  ): Promise<RegistrationModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.GUARD,
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const {
      herderId,
      vehicleNumber,
      stamp,
      photoFileId,
      signatureFileId,
      stampFileId,
      intakeDate,
      isPreButchered
    } = doc;

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
    if (signatureFileId) await FileController.findIdCheck(signatureFileId);
    if (stampFileId) await FileController.findIdCheck(stampFileId);

    // Resolve every requested animalType → animalId up front.
    const typeToId = await AnimalController.mapTypesToIds(
      Array.from(seen)
    );

    return await sequelize.transaction(async (t) => {
      const registrationNumber = await this._nextRegistrationNumber(t);

      const registration = await RegistrationModel.create(
        {
          registrationNumber,
          herderId,
          vehicleNumber: vehicleNumber.trim(),
          stamp: stamp ?? null,
          photoFileId: photoFileId ?? null,
          signatureFileId: signatureFileId ?? null,
          stampFileId: stampFileId ?? null,
          intakeDate: intakeDate ?? new Date(),
          guardId: context.id,
          status: REGISTRATION_STATUS.REGISTERED,
          isPreButchered: !!isPreButchered
        },
        { transaction: t }
      );

      await RegistrationAnimalLineModel.bulkCreate(
        doc.animalLines.map((l) => ({
          registrationId: registration.id,
          animalId: typeToId[l.animalType],
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
    // Single status (legacy) or a set — set takes precedence when both passed.
    if (doc.statuses && doc.statuses.length > 0) {
      for (const s of doc.statuses) {
        if (!Object.values(REGISTRATION_STATUS).includes(s))
          throw new Error(`Invalid registration status: ${s}`);
      }
      Object.assign(where, { status: { [Op.in]: doc.statuses } });
    } else if (doc.status) {
      Object.assign(where, { status: doc.status });
    }
    if (doc.herderId) Object.assign(where, { herderId: doc.herderId });
    if (doc.registrationNumber)
      Object.assign(where, { registrationNumber: doc.registrationNumber });

    return await RegistrationModel.findAndCountAll({
      where,
      include: [
        { model: HerderModel, as: 'herder' },
        {
          model: RegistrationAnimalLineModel,
          as: 'animalLines',
          include: [{ model: AnimalModel, as: 'animal' }]
        }
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
    // Anyone on the floor except the gate guard may weigh — cover for SCALE
    // shifts where the named operator isn't around.
    this._assertActorRole(context, [
      ADMIN_ROLE.SCALE,
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MODERATOR,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const { registrationId, animalType, weightKg, pricePerKg } = doc;
    if (!Object.values(ANIMAL_TYPE).includes(animalType))
      throw new Error(`Invalid animal type: ${animalType}`);
    if (!weightKg || weightKg <= 0)
      throw new Error('Weight must be a positive number');
    if (pricePerKg != null && pricePerKg < 0)
      throw new Error('Price per kg cannot be negative');

    const reg = await this.findIdCheck(registrationId);
    // Weighing happens in-place while the row is REGISTERED. No mid-state.
    this._assertStatus(reg, [REGISTRATION_STATUS.REGISTERED]);

    const animal = await AnimalController.resolveByType(animalType);

    const line = await RegistrationAnimalLineModel.findOne({
      where: { registrationId, animalId: animal.id }
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
          animalId: animal.id,
          weightKg,
          pricePerKg: pricePerKg ?? null,
          sequenceNo: maxSeq + 1,
          scaleOperatorId: context.id,
          photoFileId: doc.photoFileId ?? null
        },
        { transaction: t }
      );

      return entry;
    });
  }

  static async finishWeighing(
    registrationId: string,
    context: TContext
  ): Promise<RegistrationModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.SCALE,
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MODERATOR,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const reg = await this.findIdCheck(registrationId);
    // finishWeighing flips REGISTERED → WEIGHED once entries have been recorded.
    this._assertStatus(reg, [REGISTRATION_STATUS.REGISTERED]);

    const count = await WeighingEntryModel.count({ where: { registrationId } });
    if (count === 0)
      throw new Error('Cannot finish weighing with no entries recorded');

    await reg.update({ status: REGISTRATION_STATUS.WEIGHED });
    return this.getById(registrationId);
  }

  // Editing/removing a weighing entry. While weighing is in progress
  // (REGISTERED) the scale operator (and managers) may edit. Once weighing is
  // "fully uploaded" (finishWeighing → WEIGHED, and onwards through VERIFIED
  // / PAYMENT_PENDING) it is locked for operators — only MANAGER/ADMIN/
  // SUPER_ADMIN may edit. After SETTLED/CANCELLED the weights are frozen for
  // everyone.
  private static _assertWeighingEditable(
    reg: RegistrationModel,
    context: TContext
  ): void {
    const privileged: ADMIN_ROLE[] = [
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN
    ];
    if (
      reg.status === REGISTRATION_STATUS.SETTLED ||
      reg.status === REGISTRATION_STATUS.CANCELLED
    ) {
      throw new Error('Бүртгэл хаагдсан тул жинг засах боломжгүй');
    }
    const fullyUploaded =
      reg.status === REGISTRATION_STATUS.WEIGHED ||
      reg.status === REGISTRATION_STATUS.VERIFIED ||
      reg.status === REGISTRATION_STATUS.PAYMENT_PENDING;
    if (fullyUploaded) {
      if (!privileged.includes(context.role))
        throw new Error(
          'Жин баталгаажсан тул зөвхөн менежер/админ засах боломжтой'
        );
      // Open-window weigh edits: anyone on the floor except the gate guard.
    } else if (
      ![
        ADMIN_ROLE.SCALE,
        ADMIN_ROLE.STOREKEEPER,
        ADMIN_ROLE.MODERATOR,
        ...privileged
      ].includes(context.role)
    ) {
      throw new Error(
        `Forbidden: role ${context.role} cannot edit weighing entries`
      );
    }
  }

  static async updateWeighingEntry(
    doc: TUpdateWeighingEntry,
    context: TContext
  ): Promise<WeighingEntryModel> {
    const entry = await WeighingEntryModel.findByPk(doc.id);
    if (!entry) throw new Error('Weighing entry not found');

    const reg = await this.findIdCheck(entry.registrationId);
    this._assertWeighingEditable(reg, context);

    if (doc.weightKg !== undefined && doc.weightKg !== null) {
      if (doc.weightKg <= 0)
        throw new Error('Weight must be a positive number');
      entry.weightKg = doc.weightKg;
    }
    if (doc.pricePerKg !== undefined) {
      if (doc.pricePerKg != null && doc.pricePerKg < 0)
        throw new Error('Price per kg cannot be negative');
      entry.pricePerKg = doc.pricePerKg ?? null;
    }
    if (doc.animalType !== undefined && doc.animalType !== null) {
      if (!Object.values(ANIMAL_TYPE).includes(doc.animalType))
        throw new Error(`Invalid animal type: ${doc.animalType}`);
      const animal = await AnimalController.resolveByType(doc.animalType);
      const line = await RegistrationAnimalLineModel.findOne({
        where: { registrationId: entry.registrationId, animalId: animal.id }
      });
      if (!line)
        throw new Error(
          `Animal type ${doc.animalType} is not part of this registration`
        );
      entry.animalId = animal.id;
    }
    if (doc.photoFileId !== undefined) {
      if (doc.photoFileId) await FileController.findIdCheck(doc.photoFileId);
      entry.photoFileId = doc.photoFileId ?? null;
    }

    await entry.save();
    return entry;
  }

  static async deleteWeighingEntry(
    id: string,
    context: TContext
  ): Promise<void> {
    const entry = await WeighingEntryModel.findByPk(id);
    if (!entry) throw new Error('Weighing entry not found');

    const reg = await this.findIdCheck(entry.registrationId);
    this._assertWeighingEditable(reg, context);

    await entry.destroy();
  }

  // ─── Byproduct (Дайвар) ───────────────────────────────────────────

  // Suggested byproducts for a registration = active constants × animal counts.
  static async derivedByproducts(registrationId: string) {
    await this.findIdCheck(registrationId);
    const lines = await RegistrationAnimalLineModel.findAll({
      where: { registrationId },
      include: [{ model: AnimalModel, as: 'animal' }]
    });
    const counts: Record<string, number> = {};
    for (const l of lines) {
      const t = l.animal?.animalType;
      if (t) counts[t] = l.count;
    }
    return await ByproductConstantController.deriveForCounts(counts);
  }

  // Replace this registration's byproduct rows with the confirmed list
  // (derived from constants, quantities adjustable by the storekeeper).
  static async setRegistrationByproducts(
    registrationId: string,
    items: TByproductItemInput[],
    context: TContext
  ): Promise<ByproductLogModel[]> {
    this._assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.SUPER_ADMIN
    ]);

    const reg = await this.findIdCheck(registrationId);
    this._assertStatus(reg, [REGISTRATION_STATUS.WEIGHED]);

    const clean = (items ?? []).filter(
      (i) => i.name && i.name.trim() && Number(i.quantity) > 0
    );

    // Resolve every distinct animalType that appears in the input to an
    // animalId in one bulk lookup.
    const distinctTypes = Array.from(
      new Set(
        clean
          .map((i) => i.animalType)
          .filter((t): t is ANIMAL_TYPE => !!t)
      )
    );
    const typeToId = await AnimalController.mapTypesToIds(distinctTypes);

    await sequelize.transaction(async (t) => {
      await ByproductLogModel.destroy({
        where: { registrationId },
        transaction: t
      });
      if (clean.length > 0) {
        await ByproductLogModel.bulkCreate(
          clean.map((i) => {
            const quantity = Math.floor(Number(i.quantity));
            const weightKg =
              i.weightKg != null && i.weightKg !== undefined
                ? Number(Number(i.weightKg).toFixed(2))
                : null;
            return {
              registrationId,
              name: i.name.trim(),
              animalId: i.animalType ? typeToId[i.animalType] ?? null : null,
              canCoverSlaughterCost: !!i.canCoverSlaughterCost,
              count: quantity,
              averageWeightKg:
                weightKg != null && quantity > 0
                  ? Number((weightKg / quantity).toFixed(2))
                  : null,
              totalWeightKg: weightKg,
              loggedById: context.id,
              photoFileId: null
            };
          }),
          { transaction: t }
        );
      }
    });

    return await ByproductLogModel.findAll({
      where: { registrationId },
      include: [{ model: AnimalModel, as: 'animal' }],
      // animal_type ordering means joining Animals; sort by name only here.
      order: [['name', 'ASC']]
    });
  }

  // Aggregated byproduct output for handoff to the downstream factory
  // (quantity + weight by name; no price in this system).
  static async byproductHandoff(dateRange?: TDateRange) {
    const where: WhereOptions = {};
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      const r: Record<symbol, Date> = {};
      if (dateRange.startDate) r[Op.gte] = new Date(dateRange.startDate);
      if (dateRange.endDate) r[Op.lte] = new Date(dateRange.endDate);
      Object.assign(where, { createdAt: r });
    }
    const rows = await ByproductLogModel.findAll({
      where,
      include: [{ model: AnimalModel, as: 'animal' }]
    });

    // Ownership rule per row:
    //   canCoverSlaughterCost = false  → factory storage always.
    //   canCoverSlaughterCost = true   → factory only if the registration's
    //                                    verification.slaughterCoveredByByproduct
    //                                    is true (else herder keeps it).
    const regIds = Array.from(new Set(rows.map((r) => r.registrationId)));
    const verifications =
      regIds.length > 0
        ? await VerificationModel.findAll({
            where: { registrationId: { [Op.in]: regIds } }
          })
        : [];
    const coveredByReg: Record<string, boolean> = {};
    for (const v of verifications)
      coveredByReg[v.registrationId] = !!v.slaughterCoveredByByproduct;

    const factoryRows = rows.filter((r) => {
      const cc = !!r.canCoverSlaughterCost;
      if (!cc) return true;
      return coveredByReg[r.registrationId] === true;
    });

    const map: Record<
      string,
      {
        animalType: string | null;
        name: string;
        totalQuantity: number;
        totalWeightKg: number;
      }
    > = {};
    for (const b of factoryRows) {
      const at = b.animal?.animalType ?? null;
      const name = b.name ?? 'OTHER';
      const key = `${at ?? ''}|${name}`;
      if (!map[key])
        map[key] = {
          animalType: at,
          name,
          totalQuantity: 0,
          totalWeightKg: 0
        };
      map[key].totalQuantity += Number(b.count ?? 0);
      map[key].totalWeightKg += Number(b.totalWeightKg ?? 0);
    }
    return Object.values(map)
      .map((x) => ({
        ...x,
        totalWeightKg: Number(x.totalWeightKg.toFixed(2))
      }))
      .sort(
        (a, b) =>
          (a.animalType ?? '').localeCompare(b.animalType ?? '') ||
          a.name.localeCompare(b.name)
      );
  }

  // ─── Verification (Баталгаажуулалт — single signer) ───────────────
  // One authorised staff member (нярав / нягтлан / админ) confirms and signs.

  static async verify(
    doc: TVerifyInput,
    context: TContext
  ): Promise<VerificationModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
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

    if (doc.photoFileId && !verification.photoFileId) {
      verification.photoFileId = doc.photoFileId;
    }
    verification.firstVerifierId = context.id;
    verification.firstVerifiedAt = new Date();
    if (doc.notes) verification.notes = doc.notes;
    await verification.save();

    await reg.update({ status: REGISTRATION_STATUS.VERIFIED });
    return verification;
  }

  // Verifier toggles whether the slaughter cost is offset by coverable
  // byproducts (e.g. адууны өлөн гэдэс given to the factory in lieu of
  // payment). Allowed while WEIGHED (during verify) or VERIFIED (post-sign
  // adjustment before settlement).
  static async setSlaughterCovered(
    registrationId: string,
    covered: boolean,
    context: TContext
  ): Promise<VerificationModel> {
    this._assertActorRole(context, [
      ADMIN_ROLE.STOREKEEPER,
      ADMIN_ROLE.MANAGER,
      ADMIN_ROLE.ADMIN,
      ADMIN_ROLE.SUPER_ADMIN
    ]);
    const reg = await this.findIdCheck(registrationId);
    // Cover toggling is allowed up until the settlement is created — at
    // PAYMENT_PENDING the amounts are locked.
    this._assertStatus(reg, [
      REGISTRATION_STATUS.WEIGHED,
      REGISTRATION_STATUS.VERIFIED
    ]);
    const [v] = await VerificationModel.findOrCreate({
      where: { registrationId },
      defaults: {
        registrationId,
        slaughterCoveredByByproduct: !!covered
      }
    });
    v.slaughterCoveredByByproduct = !!covered;
    await v.save();
    return v;
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
      where: { registrationId: doc.registrationId },
      include: [{ model: AnimalModel, as: 'animal' }]
    });
    const regTypes = new Set(
      animalLines.map((l) => l.animal?.animalType).filter(Boolean) as string[]
    );

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
      if (l.slaughterCost != null && l.slaughterCost < 0)
        throw new Error('slaughterCost cannot be negative');
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
      include: [{ model: AnimalModel, as: 'animal' }]
    });
    const receivedByType: Record<string, number> = {};
    const meatByType: Record<string, number> = {};
    for (const w of weighing) {
      const t = w.animal?.animalType ?? '';
      const wt = Number(w.weightKg);
      const price = w.pricePerKg != null ? Number(w.pricePerKg) : 0;
      receivedByType[t] = (receivedByType[t] ?? 0) + wt;
      meatByType[t] = (meatByType[t] ?? 0) + wt * price;
    }

    // Map every line's animalType → animalId so we can persist the FK.
    const typeToId = await AnimalController.mapTypesToIds(
      Array.from(lineTypes)
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
      // slaughter step on our side. Zero it out regardless of input.
      const slaughterCost = reg.isPreButchered ? 0 : (l.slaughterCost ?? 0);

      totalMeatAmount += meatAmount;
      totalSlaughterCost += slaughterCost;

      return {
        animalId: typeToId[l.animalType],
        receivedWeightKg: Number(received.toFixed(2)),
        pricePerKg: Number(avgPrice.toFixed(2)),
        meatAmount: Number(meatAmount.toFixed(2)),
        byproductAmount: 0,
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
          payoutBankAccount: doc.payoutBankAccount?.trim() || null,
          payoutBankName: doc.payoutBankName?.trim() || null,
          payoutAccountHolderName:
            doc.payoutAccountHolderName?.trim() || null,
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

      // VERIFIED → PAYMENT_PENDING: amounts locked in, waiting for the cash.
      await reg.update(
        { status: REGISTRATION_STATUS.PAYMENT_PENDING },
        { transaction: t }
      );

      return s;
    });

    return (await SettlementModel.findByPk(settlement.id, {
      include: [
        {
          model: SettlementLineModel,
          as: 'lines',
          include: [{ model: AnimalModel, as: 'animal' }]
        }
      ]
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
    // Settlement was created during createSettlement → PAYMENT_PENDING.
    this._assertStatus(reg, [REGISTRATION_STATUS.PAYMENT_PENDING]);

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
    //   MEAT: every settlement line with received_weight_kg > 0.
    //   BYPRODUCT: each byproduct log row the factory KEEPS — ownership rule:
    //     canCoverSlaughterCost = false → always factory storage.
    //     canCoverSlaughterCost = true  → factory only if the verifier set
    //       verification.slaughterCoveredByByproduct = true (else herder).
    const lines = await SettlementLineModel.findAll({
      where: { settlementId: settlement.id },
      include: [{ model: AnimalModel, as: 'animal' }]
    });
    const byproducts = await ByproductLogModel.findAll({
      where: { registrationId }
    });
    const verification = await VerificationModel.findOne({
      where: { registrationId }
    });
    const slaughterCovered = !!verification?.slaughterCoveredByByproduct;

    const meatLines = lines
      .filter((l) => Number(l.receivedWeightKg) > 0)
      .map((l) => ({
        productType: 'MEAT' as const,
        animalType: (l.animal?.animalType ?? null) as ANIMAL_TYPE | null,
        byproductType: null,
        byproductName: null,
        quantityKg: Number(l.receivedWeightKg)
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
        productType: 'BYPRODUCT' as const,
        animalType: null,
        byproductType: null,
        byproductName: b.name as string,
        quantityKg: Number(b.totalWeightKg)
      }));

    const dto: TRegistrationIngestDTO = {
      registrationId,
      settledAt: new Date(),
      lines: [...meatLines, ...byproductLines]
    };
    await InventoryController.ingestFromSettledRegistration(dto);

    return (await SettlementModel.findByPk(settlement.id, {
      include: [
        {
          model: SettlementLineModel,
          as: 'lines',
          include: [{ model: AnimalModel, as: 'animal' }]
        }
      ]
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
    // Cancellation is only allowed before the scale operator signs off
    // (REGISTERED). After WEIGHED the amounts are part of the record.
    this._assertStatus(reg, [REGISTRATION_STATUS.REGISTERED]);

    await reg.update({ status: REGISTRATION_STATUS.CANCELLED });
    return this.getById(registrationId);
  }
}
