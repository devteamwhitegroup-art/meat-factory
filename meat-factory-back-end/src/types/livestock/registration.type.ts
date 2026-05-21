import { TPagination } from '../global/global.type';

// Бүртгэлийн дугаар starts at 8821 (per Postgres SEQUENCE).
export const REGISTRATION_NUMBER_START = 8821;

// Canonical animal-type enum — shared across livestock/sales/inventory.
export enum ANIMAL_TYPE {
  COW = 'COW', // Үхэр
  SHEEP = 'SHEEP', // Хонь
  HORSE = 'HORSE', // Адуу
  GOAT = 'GOAT', // Ямаа
  CAMEL = 'CAMEL', // Тэмээ
  CALF = 'CALF' // Тугал
}

// Canonical byproduct (дайвар) enum — shared across domains.
export enum BYPRODUCT_TYPE {
  HEART = 'HEART',
  LUNG = 'LUNG',
  LIVER = 'LIVER',
  KIDNEY = 'KIDNEY',
  STOMACH = 'STOMACH',
  INTESTINE = 'INTESTINE',
  TONGUE = 'TONGUE',
  HEAD = 'HEAD',
  TAIL = 'TAIL',
  LEG = 'LEG',
  BLOOD = 'BLOOD',
  HIDE = 'HIDE',
  OTHER = 'OTHER'
}

export enum REGISTRATION_STATUS {
  REGISTERED = 'REGISTERED', // intake created by guard
  WEIGHING = 'WEIGHING', // first weighing entry recorded
  WEIGHED = 'WEIGHED', // scale operator finished weighing
  VERIFIED = 'VERIFIED', // two distinct staff verified
  SETTLED = 'SETTLED', // settlement paid
  CANCELLED = 'CANCELLED' // voided before weighing finished
}

export type TRegistrationAnimalLineInput = {
  animalType: ANIMAL_TYPE;
  count: number;
};

export type TRegistration = {
  id: string;
  registrationNumber: number;
  herderId: string;
  vehicleNumber: string;
  stamp: string | null;
  photoFileId: string | null;
  intakeDate: Date;
  guardId: string;
  status: REGISTRATION_STATUS;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateRegistration = {
  herderId: string;
  vehicleNumber: string;
  stamp?: string | null;
  photoFileId?: string | null;
  intakeDate?: Date | null;
  animalLines: TRegistrationAnimalLineInput[];
};

export type TGetRegistrations = {
  status?: REGISTRATION_STATUS;
  herderId?: string;
  registrationNumber?: number;
} & TPagination;

export type TRegistrationAnimalLine = {
  id: string;
  registrationId: string;
  animalType: ANIMAL_TYPE;
  count: number;
  createdAt: Date;
  updatedAt: Date;
};
