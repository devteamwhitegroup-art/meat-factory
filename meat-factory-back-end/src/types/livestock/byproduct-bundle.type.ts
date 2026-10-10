// Herder-facing byproduct row per wrapper (гэдэс) per registration — see
// ByproductBundleModel. Intake is count only.
export type TByproductBundle = {
  id: string;
  registrationId: string;
  wrapperId: string;
  count: number;
  herderCount: number;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TByproductBundleInput = {
  wrapperId: string;
  count: number;
  herderCount?: number | null;
};

// Read shape: saved rows, or (before the first save) defaults derived from
// active wrappers × animal counts, factory keeping everything.
export type TByproductBundleView = {
  id: string | null;
  wrapperId: string;
  wrapperName: string;
  animalId: string;
  animalType: string;
  count: number;
  herderCount: number;
  unitPrice: number;
};
