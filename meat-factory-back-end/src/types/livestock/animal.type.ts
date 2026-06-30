import { ANIMAL_TYPE } from './registration.type';

// Default Mongolian display name per type — used by the boot seed + upsert
// default. Admin can override via /animals.
export const ANIMAL_TYPE_LABEL: Record<ANIMAL_TYPE, string> = {
  [ANIMAL_TYPE.COW]: 'Үхэр',
  [ANIMAL_TYPE.SHEEP]: 'Хонь',
  [ANIMAL_TYPE.HORSE]: 'Адуу',
  [ANIMAL_TYPE.GOAT]: 'Ямаа',
  [ANIMAL_TYPE.CAMEL]: 'Тэмээ'
};

// Top-level per-animal-type config:
//   pricePerAnimal — slaughter (бой) cost per head; pre-fills settlement.
//   canCoverSlaughterCost — whether THIS animal's byproducts may be used to
//     offset the slaughter cost (verifier toggles per-registration). Lives on
//     the animal so all wrappers (e.g. өлөн гэдэс, гэдэс) of that animal share it.
// Hierarchy: Animal → ByproductWrapper → ByproductConstant.
export type TAnimal = {
  id: string;
  animalType: ANIMAL_TYPE;
  // Mongolian display name (Үхэр, Хонь, …). The catalogue source of truth so
  // BE+FE stop hardcoding the translation.
  name: string;
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
  name?: string;
  pricePerAnimal?: number;
  canCoverSlaughterCost?: boolean;
  yieldPercent?: number;
  isActive?: boolean;
};
