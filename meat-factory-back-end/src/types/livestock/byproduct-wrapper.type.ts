import { TPagination } from '../global/global.type';

// A "wrapper" (өлөн гэдэс / гэдэс) is a per-animal bundle that contains the
// individual byproduct items. The wrapper now joins to the Animal config by
// id (animalId FK) instead of carrying its own animalType enum.
// `price` is what one bundle is worth to the herder: every bundle the factory
// keeps is credited to the herder's settlement (offsetting бой зардал). The
// herder only ever sees bundles, never the items inside.
export type TByproductWrapper = {
  id: string;
  animalId: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateByproductWrapper = {
  // Caller passes animalType for ergonomics — back-end resolves it to the
  // Animals row and stores animalId.
  animalType: string;
  name: string;
  price?: number;
};

export type TUpdateByproductWrapper = Partial<TCreateByproductWrapper> & {
  id: string;
  isActive?: boolean;
};

export type TGetByproductWrappers = {
  animalType?: string;
  search?: string;
  isActive?: boolean;
} & TPagination;
