import { ANIMAL_TYPE } from './registration.type';

// Top-level per-animal-type config:
//   pricePerAnimal — slaughter (бой) cost per head; pre-fills settlement.
//   canCoverSlaughterCost — whether THIS animal's byproducts may be used to
//     offset the slaughter cost (verifier toggles per-registration). Lives on
//     the animal so all wrappers (e.g. өлөн гэдэс, гэдэс) of that animal share it.
// Hierarchy: Animal → ByproductWrapper → ByproductConstant.
export type TAnimal = {
  id: string;
  animalType: ANIMAL_TYPE;
  pricePerAnimal: number;
  canCoverSlaughterCost: boolean;
  // Carcass-to-saleable yield (%) applied when meat hits inventory. Horse =
  // 70 (bone deduction for foreign-market shipments); everything else = 100.
  yieldPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TUpsertAnimal = {
  animalType: ANIMAL_TYPE;
  pricePerAnimal?: number;
  canCoverSlaughterCost?: boolean;
  yieldPercent?: number;
  isActive?: boolean;
};
