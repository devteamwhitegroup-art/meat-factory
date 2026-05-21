import { ANIMAL_TYPE } from './registration.type';

export type TSettlementLineInput = {
  animalType: ANIMAL_TYPE;
  pricePerKg: number;
  slaughterCost?: number; // Бой зардал (default 0)
  byproductPricePerKg?: number; // monetary rate for allocated byproduct
};

export type TCreateSettlement = {
  registrationId: string;
  lines: TSettlementLineInput[];
  notes?: string | null;
  photoFileId?: string | null;
};

export type TSettlementLine = {
  id: string;
  settlementId: string;
  animalType: ANIMAL_TYPE;
  receivedWeightKg: number; // Хүлээн авсан
  pricePerKg: number;
  meatAmount: number;
  byproductAmount: number; // Дайвар
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
  isPaid: boolean;
  paidAt: Date | null;
  settledById: string | null;
  notes: string | null;
  photoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Plain DTO handed to InventoryController on settlement-paid (Phase 2).
// Defined here so livestock never imports the inventory module.
export type TRegistrationIngestLine = {
  productType: 'MEAT' | 'BYPRODUCT';
  animalType?: ANIMAL_TYPE | null;
  byproductType?: string | null;
  quantityKg: number;
};

export type TRegistrationIngestDTO = {
  registrationId: string;
  settledAt: Date;
  lines: TRegistrationIngestLine[];
};
