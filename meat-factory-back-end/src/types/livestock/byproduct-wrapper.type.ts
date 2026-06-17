import { TPagination } from '../global/global.type';
import { ANIMAL_TYPE } from './registration.type';

// A "wrapper" (өлөн гэдэс / гэдэс) is a per-animal bundle that contains the
// individual byproduct items. The wrapper now joins to the Animal config by
// id (animalId FK) instead of carrying its own animalType enum. The
// slaughter-cost-cover flag still lives on the Animal config (so all wrappers
// of a horse share it), NOT on the wrapper.
export type TByproductWrapper = {
  id: string;
  animalId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateByproductWrapper = {
  // Caller passes animalType for ergonomics — back-end resolves it to the
  // Animals row and stores animalId.
  animalType: ANIMAL_TYPE;
  name: string;
};

export type TUpdateByproductWrapper = Partial<TCreateByproductWrapper> & {
  id: string;
  isActive?: boolean;
};

export type TGetByproductWrappers = {
  animalType?: ANIMAL_TYPE;
  search?: string;
  isActive?: boolean;
} & TPagination;
