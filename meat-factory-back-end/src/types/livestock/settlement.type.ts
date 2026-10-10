import { TDateRange, TPagination } from '../global/global.type';
import { FACTORY } from '../user/admin.type';

// Бой зардал is not an input: it is fixed per head (Animal.pricePerAnimal ×
// count, snapshotted on the animal line at intake).
export type TSettlementLineInput = {
  animalType: string;
};

export type TCreateSettlement = {
  registrationId: string;
  lines: TSettlementLineInput[];
  notes?: string | null;
  photoFileId?: string | null;
  // Per-settlement payout override. When any field is set we use it instead
  // of the herder's default bank fields (doesn't mutate the herder).
  payoutBankAccount?: string | null;
  payoutBankName?: string | null;
  payoutAccountHolderName?: string | null;
};

export type TSettlementLine = {
  id: string;
  settlementId: string;
  // Persisted FK; the GraphQL animalType field is resolved via the joined Animal.
  animalId: string;
  receivedWeightKg: number; // Хүлээн авсан
  pricePerKg: number;
  meatAmount: number;
  byproductAmount: number; // Дайвар — Σ kept гэдэс × price
  slaughterCost: number; // Бой зардал
  createdAt: Date;
  updatedAt: Date;
};

export type TSettlement = {
  id: string;
  registrationId: string;
  totalMeatAmount: number;
  totalByproductAmount: number; // Дайвар нийт
  totalSlaughterCost: number;
  grossAmount: number; // Нийт төлбөр
  netPayable: number;
  // Optional payout override (per settlement). Null = use the herder's bank.
  payoutBankAccount: string | null;
  payoutBankName: string | null;
  payoutAccountHolderName: string | null;
  // Divisible payout. heldAmount is withheld pending medical-number approval;
  // paidAmount is what's been disbursed so far. netPayable = paidAmount +
  // (remaining held). isPaid flips true only when the held part is released.
  heldAmount: number;
  paidAmount: number;
  heldReleasedAt: Date | null;
  isPaid: boolean;
  paidAt: Date | null;
  settledById: string | null;
  notes: string | null;
  photoFileId: string | null;
  storekeeperSignatureFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TGetSettlements = {
  factory?: FACTORY;
  isPaid?: boolean;
  herderId?: string;
  dateRange?: TDateRange;
} & TPagination;
