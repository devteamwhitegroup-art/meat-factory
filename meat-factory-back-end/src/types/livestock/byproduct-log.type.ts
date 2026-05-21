import { BYPRODUCT_TYPE } from './registration.type';

export type TByproductLog = {
  id: string;
  registrationId: string;
  byproductType: BYPRODUCT_TYPE;
  count: number; // ширхэг
  averageWeightKg: number; // дундаж жин
  totalWeightKg: number; // = count * averageWeightKg (stored)
  loggedById: string;
  photoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateByproductLog = {
  registrationId: string;
  byproductType: BYPRODUCT_TYPE;
  count: number;
  averageWeightKg: number;
  photoFileId?: string | null;
};
