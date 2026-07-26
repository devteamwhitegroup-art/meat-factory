import { TDateRange, TPagination } from '../global/global.type';
import { PRODUCT_TYPE } from '../sales/sales-transaction.type';

export enum MOVEMENT_TYPE {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum MOVEMENT_SOURCE {
  SETTLEMENT = 'SETTLEMENT',
  // Non-coverable byproducts (canCoverSlaughterCost=false) — deterministically
  // factory-owned from the moment they're logged, so they enter inventory
  // right away instead of waiting for settlement payout.
  BYPRODUCT = 'BYPRODUCT',
  SHIPMENT = 'SHIPMENT',
  MANUAL = 'MANUAL'
}

export type TInventoryItem = {
  id: string;
  sku: string;
  productType: PRODUCT_TYPE;
  // Animal catalogue FK for MEAT rows. Null for byproducts.
  animalId: string | null;
  // Free-form Mongolian byproduct name (e.g. "Адууны хэл", "Хацар мах") — the
  // only byproduct identity. SKU is Дайвар:<name>.
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
  animalId?: string | null;
  byproductName?: string | null;
  quantityKg: number;
  direction: MOVEMENT_TYPE;
  notes?: string | null;
};

export type TGetMovements = {
  inventoryItemId?: string;
  movementType?: MOVEMENT_TYPE;
  source?: MOVEMENT_SOURCE;
  dateRange?: TDateRange;
} & TPagination;

export type TGetStock = {
  productType?: PRODUCT_TYPE;
  animalId?: string;
  byproductName?: string;
};

// Decoupling DTOs — callers (livestock settlement, shipment) hand these
// to InventoryController so it never imports those modules' controllers.
export type TStockLine = {
  productType: PRODUCT_TYPE;
  animalId?: string | null;
  // BYPRODUCT lines carry a free-form byproductName (SKU Дайвар:<name>).
  byproductName?: string | null;
  quantityKg: number;
};

export type TShipmentOutDTO = {
  shipmentId: string;
  lines: TStockLine[];
};
