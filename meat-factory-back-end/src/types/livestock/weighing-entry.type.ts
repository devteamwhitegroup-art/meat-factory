// The persisted row stores animalId (FK). The animal is reached via the joined
// Animal. Controller-facing inputs accept the animal NAME (the catalogue key),
// resolved server-side to animalId.
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
  animalType: string;
  weightKg: number;
  pricePerKg?: number | null;
  photoFileId?: string | null;
};

export type TUpdateWeighingEntry = {
  id: string;
  weightKg?: number;
  pricePerKg?: number | null;
  animalType?: string;
  photoFileId?: string | null;
};
