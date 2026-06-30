import { TPagination } from '../global/global.type';

// A constant is a single byproduct item that belongs to a wrapper.
// The animalType is reached through wrapper → animal (no denormalized column).
export type TByproductConstant = {
  id: string;
  wrapperId: string;
  name: string;
  quantityPerAnimal: number;
  unitWeightKg: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateByproductConstant = {
  wrapperId: string;
  name: string;
  quantityPerAnimal: number;
  unitWeightKg?: number | null;
};

export type TUpdateByproductConstant = Partial<TCreateByproductConstant> & {
  id: string;
  isActive?: boolean;
};

export type TGetByproductConstants = {
  wrapperId?: string;
  // Filter by animal type joins through the wrapper.
  animalType?: string;
  search?: string;
  isActive?: boolean;
} & TPagination;

// Byproduct derived from constants × slaughtered animal counts.
// animalType + canCoverSlaughterCost both come off the joined Animal row.
export type TDerivedByproduct = {
  animalType: string;
  wrapperId: string | null;
  wrapperName: string | null;
  name: string;
  quantity: number;
  unitWeightKg: number | null;
  weightKg: number | null;
  canCoverSlaughterCost: boolean;
};
