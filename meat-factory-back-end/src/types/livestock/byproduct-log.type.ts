import { ANIMAL_TYPE } from './registration.type';

// Byproduct logs are free-form (named) and FK into Animals. The legacy
// byproductType ENUM and sourceConstantId audit FK were both removed —
// `name` is the canonical identifier and the constant→log audit chain was
// never wired through the FE.
export type TByproductLog = {
  id: string;
  registrationId: string;
  name: string | null; // free-form Mongolian name (e.g. "Үхэр толгой")
  // FK to Animals; animalType is reached via the joined Animal. Nullable
  // because some free-form byproducts may not be tied to an animal.
  animalId: string | null;
  // Denormalised from the wrapper at save-time. Drives the handoff ownership
  // rule: false → factory storage always; true → factory only if the
  // registration's verification.slaughterCoveredByByproduct is also true (else
  // the herder keeps it).
  canCoverSlaughterCost: boolean | null;
  count: number; // ширхэг (quantity)
  averageWeightKg: number | null; // дундаж жин (optional)
  totalWeightKg: number | null; // = count * averageWeightKg (optional)
  loggedById: string;
  photoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// One derived/confirmed byproduct row (auto-derivation from constants).
export type TByproductItemInput = {
  name: string;
  animalType?: ANIMAL_TYPE | null;
  quantity: number;
  weightKg?: number | null;
  canCoverSlaughterCost?: boolean | null;
};
