import { ANIMAL_TYPE } from './registration.type';

// The persisted row stores animalId (FK). animalType is reached via the joined
// Animal. The controller-facing inputs still accept animalType for ergonomics
// (FE selects from the enum-driven catalogue), resolved server-side.
export type TWeighingEntry = {
  id: string;
  registrationId: string;
  animalId: string;
  weightKg: number;
  // Negotiated price per kg for THIS animal (dynamic — a small animal can be
  // priced lower after the staff negotiates with the herder).
  pricePerKg: number | null;
  sequenceNo: number; // capture order within a registration (Түүх)
  scaleOperatorId: string;
  photoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateWeighingEntry = {
  registrationId: string;
  animalType: ANIMAL_TYPE;
  weightKg: number;
  pricePerKg?: number | null;
  photoFileId?: string | null;
};

export type TUpdateWeighingEntry = {
  id: string;
  weightKg?: number;
  pricePerKg?: number | null;
  animalType?: ANIMAL_TYPE;
  photoFileId?: string | null;
};
