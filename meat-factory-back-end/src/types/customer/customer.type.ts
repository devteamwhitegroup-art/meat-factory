import { TPagination } from '../global/global.type';

// LOCAL_BROKER       = орон нутгийн (countryside) middle-man, smaller scale
// ULAANBAATAR_BROKER = Ulaanbaatar middle-man, main domestic buyer
// FACTORY            = downstream meat factory / big repeat client
//
// No field-level differences — this is just a tag so the sales + shipment
// dropdowns can filter and the customer list can show the right badge.
export enum CUSTOMER_KIND {
  LOCAL_BROKER = 'LOCAL_BROKER',
  ULAANBAATAR_BROKER = 'ULAANBAATAR_BROKER',
  FACTORY = 'FACTORY'
}

export type TCustomer = {
  id: string;
  name: string;
  kind: CUSTOMER_KIND;
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
  kind?: CUSTOMER_KIND;
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
  kind?: CUSTOMER_KIND;
} & TPagination;
