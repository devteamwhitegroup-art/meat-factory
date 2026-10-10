import { TDateRange, TPagination } from '../global/global.type';
import { PRODUCT_TYPE } from '../sales/sales-transaction.type';
import { FACTORY } from '../user/admin.type';

export enum MOVEMENT_TYPE {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum MOVEMENT_SOURCE {
  // FACTORY_1 meat — slaughtered, weighed and verified is factory stock,
  // independent of when the herder is actually paid.
  VERIFICATION = 'VERIFICATION',
  // Legacy (pre factory split) settlement-time byproduct ingest. No longer
  // written; kept because existing movement rows carry it.
  SETTLEMENT = 'SETTLEMENT',
  // Byproducts the factory keeps: FACTORY_1 items at settlement creation,
  // FACTORY_2 гэдэс at finishWeighing.
  BYPRODUCT = 'BYPRODUCT',
  // FACTORY_2 pre-butchered meat — stock as soon as weighing is finished.
  WEIGHING = 'WEIGHING',
  // Counted byproducts sent FACTORY_1/2 → FACTORY_3 (OUT + IN pair).
  TRANSFER = 'TRANSFER',
  // FACTORY_3 disassembly: гэдэс count OUT, weighed organ kg IN.
  PROCESSING = 'PROCESSING',
  SHIPMENT = 'SHIPMENT',
  MANUAL = 'MANUAL'
}

// Each factory keeps its own stock: SKU is unique per factory. Meat and
// weighed byproducts are tracked in kg; incoming гэдэс in pieces (count).
export type TInventoryItem = {
  id: string;
  factory: FACTORY;
  sku: string;
  productType: PRODUCT_TYPE;
  // Animal catalogue FK for MEAT rows. Null for byproducts.
  animalId: string | null;
  // Free-form Mongolian byproduct name (e.g. "Адууны хэл", "Хацар мах") — the
  // only byproduct identity. SKU is Дайвар:<name>.
  byproductName: string | null;
  quantityKg: number;
  quantityCount: number;
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
  quantityCount: number;
  balanceAfterCount: number;
  sourceRegistrationId: string | null;
  sourceShipmentId: string | null;
  createdById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TManualAdjustInput = {
  // Owner/admin pick; factory staff adjust their own stock.
  factory?: FACTORY | null;
  productType: PRODUCT_TYPE;
  animalId?: string | null;
  byproductName?: string | null;
  quantityKg?: number | null;
  quantityCount?: number | null;
  direction: MOVEMENT_TYPE;
  notes?: string | null;
};

export type TGetMovements = {
  factory?: FACTORY;
  inventoryItemId?: string;
  movementType?: MOVEMENT_TYPE;
  source?: MOVEMENT_SOURCE;
  dateRange?: TDateRange;
} & TPagination;

export type TGetStock = {
  factory?: FACTORY;
  productType?: PRODUCT_TYPE;
  animalId?: string;
  byproductName?: string;
};

// Decoupling DTOs — callers (livestock settlement, shipment) hand these
// to InventoryController so it never imports those modules' controllers.
export type TStockLine = {
  factory: FACTORY;
  productType: PRODUCT_TYPE;
  animalId?: string | null;
  // BYPRODUCT lines carry a free-form byproductName (SKU Дайвар:<name>).
  byproductName?: string | null;
  quantityKg: number;
  // Pieces — гэдэс bundles before disassembly. Omitted = 0.
  quantityCount?: number;
};

export type TShipmentOutDTO = {
  shipmentId: string;
  lines: TStockLine[];
};
