import { TPagination } from '../global/global.type';

// Admin-curated address catalogue used by the herder intake form. Free-form
// Mongolian text (e.g. "Дорнод аймаг, Хэрлэн сум"). The herder model keeps
// its legacy `address` STRING column for back-compat — addressId is the
// preferred path going forward.
export type THerderAddress = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateHerderAddress = {
  name: string;
  isActive?: boolean;
};

export type TUpdateHerderAddress = Partial<TCreateHerderAddress> & {
  id: string;
};

export type TGetHerderAddresses = {
  search?: string;
  isActive?: boolean;
} & TPagination;
