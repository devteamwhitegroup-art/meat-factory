import { ANIMAL_TYPE } from './registration.type';

export type TWeighingEntry = {
  id: string;
  registrationId: string;
  animalType: ANIMAL_TYPE;
  weightKg: number;
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
  photoFileId?: string | null;
};
