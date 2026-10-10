import { TDateRange, TPagination } from "../global/global.type";
import { FACTORY } from "../user/admin.type";

// The vet (эмч) checks each number against the government service and records
// the outcome here. A registration counts as approved (medicalNumberApproved)
// only when it has at least one number and every number is APPROVED.
export enum MEDICAL_NUMBER_STATUS {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Мал эмнэлгийн гэрчилгээний дугаар — exactly 7 digits.
export const MEDICAL_NUMBER_RE = /^\d{7}$/;

export type TMedicalNumber = {
  id: string;
  registrationId: string;
  number: string;
  status: MEDICAL_NUMBER_STATUS;
  checkedById: string | null;
  checkedAt: Date | null;
};

export type TGetMedicalNumbers = {
  status?: MEDICAL_NUMBER_STATUS;
  // Partial match on the digits.
  number?: string;
  factory?: FACTORY;
  dateRange?: TDateRange;
} & TPagination;
