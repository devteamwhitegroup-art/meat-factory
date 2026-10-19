// Herder-facing byproduct row per registration — see ByproductBundleModel.
// wrapperId (whole гэдэс) or constantId (single item, PRE_BUTCHERED only).
// Intake is count only.
export type TByproductBundle = {
  id: string;
  registrationId: string;
  wrapperId: string | null;
  constantId: string | null;
  count: number;
  herderCount: number;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TByproductBundleInput = {
  wrapperId?: string | null;
  constantId?: string | null;
  count: number;
  herderCount?: number | null;
  // PRE_BUTCHERED only: market price for this intake (default: price list).
  unitPrice?: number | null;
};

// Read shape: saved rows, or (before the first save) defaults from the
// site's price list × animal counts, factory keeping everything.
export type TByproductBundleView = {
  id: string | null;
  wrapperId: string | null;
  constantId: string | null;
  // Wrapper or item name.
  name: string;
  animalId: string;
  animalType: string;
  count: number;
  herderCount: number;
  unitPrice: number;
};
