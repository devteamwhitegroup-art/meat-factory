import { TPagination } from '../global/global.type';
import {
  ANIMAL_TYPE,
  BYPRODUCT_TYPE
} from '../livestock/registration.type';
import { PRODUCT_TYPE } from '../sales/sales-transaction.type';

export enum MOVEMENT_TYPE {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum MOVEMENT_SOURCE {
  SETTLEMENT = 'SETTLEMENT',
  SHIPMENT = 'SHIPMENT',
  MANUAL = 'MANUAL'
}

export type TInventoryItem = {
  id: string;
  sku: string;
  productType: PRODUCT_TYPE;
  animalType: ANIMAL_TYPE | null;
  // Legacy BYPRODUCT_TYPE enum (HEART, LIVER, ...). Still used by the
  // manual-adjust path + sales line items.
  byproductType: BYPRODUCT_TYPE | null;
  // Free-form Mongolian byproduct name (e.g. "Адууны хэл", "Хацар мах").
  // Populated by livestock byproduct ingestion after Phase-3 redesign —
  // the byproduct catalogue is name-driven and no longer maps to the enum.
  byproductName: string | null;
  quantityKg: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TInventoryMovement = {
  id: string;
  inventoryItemId: string;
  movementType: MOVEMENT_TYPE;
  source: MOVEMENT_SOURCE;
  quantityKg: number;
  balanceAfterKg: number;
  sourceRegistrationId: string | null;
  sourceShipmentId: string | null;
  createdById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TManualAdjustInput = {
  productType: PRODUCT_TYPE;
  animalType?: ANIMAL_TYPE | null;
  byproductType?: BYPRODUCT_TYPE | null;
  quantityKg: number;
  direction: MOVEMENT_TYPE;
  notes?: string | null;
};

export type TGetMovements = {
  inventoryItemId?: string;
  movementType?: MOVEMENT_TYPE;
  source?: MOVEMENT_SOURCE;
  dateRange?: { startDate?: Date | null; endDate?: Date | null };
} & TPagination;

export type TGetStock = {
  productType?: PRODUCT_TYPE;
  animalType?: ANIMAL_TYPE;
  byproductType?: BYPRODUCT_TYPE;
};

// Decoupling DTOs — callers (livestock settlement, shipment) hand these
// to InventoryController so it never imports those modules' controllers.
export type TStockLine = {
  productType: PRODUCT_TYPE;
  animalType?: ANIMAL_TYPE | null;
  // Set either byproductType OR byproductName for BYPRODUCT lines (not both).
  byproductType?: BYPRODUCT_TYPE | null;
  byproductName?: string | null;
  quantityKg: number;
};

export type TShipmentOutDTO = {
  shipmentId: string;
  lines: TStockLine[];
};
