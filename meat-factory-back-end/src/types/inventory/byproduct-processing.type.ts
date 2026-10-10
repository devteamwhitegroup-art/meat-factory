import { TDateRange, TPagination } from '../global/global.type';
import { FACTORY } from '../user/admin.type';

// One disassembly batch at the byproduct factory (FACTORY_3): N гэдэс of one
// wrapper are taken apart and each organ's total is weighed. Expected kg is
// the norm snapshot (N × quantityPerAnimal × unitWeightKg) at batch time —
// the guess everything ran on until now; actual kg is what the scale said.
export type TByproductProcessing = {
  id: string;
  // BP-YYYYMMDD-N
  code: string;
  factory: FACTORY;
  wrapperId: string;
  bundleCount: number;
  createdById: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TByproductProcessingLine = {
  id: string;
  processingId: string;
  constantId: string | null;
  name: string;
  expectedCount: number;
  // Null when the norm has no unitWeightKg (nothing to expect).
  expectedKg: number | null;
  actualKg: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateByproductProcessing = {
  factory?: FACTORY | null;
  wrapperId: string;
  bundleCount: number;
  // One per active item of the wrapper.
  lines: { constantId: string; actualKg: number }[];
  notes?: string | null;
};

export type TGetByproductProcessings = {
  factory?: FACTORY;
  wrapperId?: string;
  dateRange?: TDateRange;
} & TPagination;

// Counted byproducts sent from FACTORY_1/2 stock to the byproduct factory.
export type TTransferByproducts = {
  fromFactory?: FACTORY | null;
  lines: { inventoryItemId: string; count: number }[];
  notes?: string | null;
};

export type TProcessingSummaryRow = {
  animalType: string;
  wrapperName: string;
  name: string;
  bundleCount: number;
  expectedKg: number;
  actualKg: number;
  diffKg: number;
  // Null when nothing was expected (norm without unitWeightKg).
  diffPercent: number | null;
};
