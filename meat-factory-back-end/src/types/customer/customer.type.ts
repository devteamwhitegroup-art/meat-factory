import { TPagination } from '../global/global.type';

export type TCustomer = {
  id: string;
  name: string;
  contactPhone: string | null;
  address: string | null;
  bankAccount: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateCustomer = {
  name: string;
  contactPhone?: string | null;
  address?: string | null;
  bankAccount?: string | null;
  registrationNumber?: string | null;
  taxId?: string | null;
};

export type TUpdateCustomer = Partial<TCreateCustomer> & {
  id: string;
  isActive?: boolean;
};

export type TGetCustomers = {
  search?: string;
  isActive?: boolean;
} & TPagination;
