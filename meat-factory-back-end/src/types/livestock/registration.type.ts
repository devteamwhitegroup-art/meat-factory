import { TDateRange, TPagination } from "../global/global.type";

export enum REGISTRATION_STATUS {
  REGISTERED = "REGISTERED", // intake created by guard (weighing happens in-place)
  WEIGHED = "WEIGHED", // scale operator finished weighing
  VERIFIED = "VERIFIED", // single signer (нярав / нягтлан / админ) confirmed
  PAYMENT_PENDING = "PAYMENT_PENDING", // settlement created, awaiting payment
  PARTIALLY_SETTLED = "PARTIALLY_SETTLED", // part paid, rest held pending medical-number approval
  SETTLED = "SETTLED", // settlement fully paid (held released)
  CANCELLED = "CANCELLED", // voided before weighing finished
}

export type TRegistrationAnimalLineInput = {
  // Animal catalogue name (the ANIMAL_TYPE enum was removed).
  animalType: string;
  count: number;
};

export type TRegistration = {
  id: string;
  // Human-readable key REG-YYYYMMDD-N.
  registrationCode: string;
  herderId: string;
  vehicleNumber: string;
  stamp: string | null;
  // Legacy single number — superseded by MedicalNumbers (see model).
  medicalNumber: string | null;
  // Every MedicalNumber is APPROVED (kept in sync by MedicalNumberController).
  // While false, the settlement's held portion can't be released (paid out).
  medicalNumberApproved: boolean;
  photoFileId: string | null;
  signatureFileId: string | null;
  stampFileId: string | null;
  // Herder's drawn agreement signature on the weighed slip (pre-VERIFIED).
  agreementSignatureFileId: string | null;
  intakeDate: Date;
  guardId: string;
  status: REGISTRATION_STATUS;
  factory: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateRegistration = {
  herderId: string;
  vehicleNumber: string;
  stamp?: string | null;
  // 7-digit medical certificate numbers (bulk intake often has several).
  medicalNumbers?: string[] | null;
  photoFileId?: string | null;
  signatureFileId?: string | null;
  stampFileId?: string | null;
  intakeDate?: Date | null;
  // Owner/admin pick it; factory staff are always stamped with their own.
  factory?: string | null;
  animalLines: TRegistrationAnimalLineInput[];
  // FACTORY_2 only: meat weighed right on the intake form (type, kg, ₮/kg) —
  // stored as weighing entries; the registration stays REGISTERED so гэдэс
  // and "finish" still happen on the weigh page.
  weighings?: TIntakeWeighing[] | null;
};

export type TIntakeWeighing = {
  animalType: string;
  weightKg: number;
  pricePerKg: number;
};

export type TGetRegistrations = {
  status?: REGISTRATION_STATUS;
  // Set filter (status IN […]). Used by the FE stage chips
  // (e.g. "Дүн тооцоолж буй" = [WEIGHED, VERIFIED]).
  statuses?: REGISTRATION_STATUS[];
  herderId?: string;
  registrationCode?: string;
  // Owner/admin only — factory staff are always scoped to their own.
  factory?: string;
  // Filters on intakeDate (livestock arrival), inclusive both ends.
  dateRange?: TDateRange;
} & TPagination;

export type TRegistrationAnimalLine = {
  id: string;
  registrationId: string;
  // FK to Animals; animalType is reached via the joined Animal row.
  animalId: string;
  count: number;
  // Бой зардал per type, captured at weighing (pre-VERIFIED). Default 0.
  slaughterCost: number;
  createdAt: Date;
  updatedAt: Date;
};

// Intake fields fixable after creation: the person who registered it edits
// them directly the same day (UTC+8); afterwards a change request goes to
// admin. Medical numbers have their own add/remove flow.
export type TIntakeChanges = {
  herderId: string;
  vehicleNumber: string;
  stamp?: string | null;
  animalLines: TRegistrationAnimalLineInput[];
};

// Weighing fixes once weighing is finished (admin-locked) — request only.
export type TWeightChange = {
  entryId: string;
  weightKg: number;
  pricePerKg?: number | null;
};
export type TWeighingAdd = {
  animalType: string;
  weightKg: number;
  pricePerKg?: number | null;
};

// What a change request proposes; each part optional (absent = untouched).
export type TRegistrationChanges = {
  intake?: TIntakeChanges | null;
  weights?: TWeightChange[] | null;
  added?: TWeighingAdd[] | null;
};

export type TUpdateRegistration = TIntakeChanges & { id: string };

export type TRequestRegistrationChange = TRegistrationChanges & {
  registrationId: string;
  reason: string;
};

export enum CHANGE_REQUEST_STATUS {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type TRegistrationChangeRequest = {
  id: string;
  registrationId: string;
  requestedById: string;
  // Proposed values (already validated/normalised when requested).
  changes: TRegistrationChanges;
  reason: string;
  status: CHANGE_REQUEST_STATUS;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
};

export type TGetRegistrationChangeRequests = {
  status?: CHANGE_REQUEST_STATUS;
  registrationId?: string;
} & TPagination;
