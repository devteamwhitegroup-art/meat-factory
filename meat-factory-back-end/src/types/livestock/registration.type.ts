import { TDateRange, TPagination } from '../global/global.type';
import { FACTORY } from '../user/admin.type';

// FACTORY_2 only ever receives pre-butchered meat: no stamp, no slaughter
// cost, no verify step — meat + гэдэс go to stock at finishWeighing and
// finance settles later. FACTORY_1 is the live-animal slaughter flow.
export const isPreButchered = (reg: { factory: FACTORY }): boolean =>
  reg.factory === FACTORY.FACTORY_2;

export enum REGISTRATION_STATUS {
  REGISTERED = 'REGISTERED', // intake created by guard (weighing happens in-place)
  WEIGHED = 'WEIGHED', // scale operator finished weighing
  VERIFIED = 'VERIFIED', // single signer (нярав / нягтлан / админ) confirmed
  PAYMENT_PENDING = 'PAYMENT_PENDING', // settlement created, awaiting payment
  PARTIALLY_SETTLED = 'PARTIALLY_SETTLED', // part paid, rest held pending medical-number approval
  SETTLED = 'SETTLED', // settlement fully paid (held released)
  CANCELLED = 'CANCELLED' // voided before weighing finished
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
  factory: FACTORY;
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
  factory?: FACTORY | null;
  animalLines: TRegistrationAnimalLineInput[];
};

export type TGetRegistrations = {
  status?: REGISTRATION_STATUS;
  // Set filter (status IN […]). Used by the FE stage chips
  // (e.g. "Дүн тооцоолж буй" = [WEIGHED, VERIFIED]).
  statuses?: REGISTRATION_STATUS[];
  herderId?: string;
  registrationCode?: string;
  // Owner/admin only — factory staff are always scoped to their own.
  factory?: FACTORY;
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

