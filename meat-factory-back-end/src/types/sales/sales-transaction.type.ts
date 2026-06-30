import { TPagination } from '../global/global.type';
import { ANIMAL_TYPE } from '../livestock/registration.type';

export enum PAYMENT_STATUS {
  PAID = 'PAID', // ТӨЛБӨР ХИЙСЭН
  PENDING = 'PENDING' // ХҮЛЭЭГДЭЖ БУЙ
}

export enum PRODUCT_TYPE {
  MEAT = 'MEAT',
  BYPRODUCT = 'BYPRODUCT'
}

export type TSalesLineItem = {
  id: string;
  salesTransactionId: string;
  productType: PRODUCT_TYPE;
  animalType: ANIMAL_TYPE | null;
  // Free-form byproduct name from the byproduct catalogue (BYPRODUCT lines).
  byproductName: string | null;
  quantityKg: number;
  unitPrice: number;
  lineAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateLineItemInput = {
  productType: PRODUCT_TYPE;
  animalType?: ANIMAL_TYPE | null;
  byproductName?: string | null;
  quantityKg: number;
  unitPrice: number;
};

export type TSalesTransaction = {
  id: string;
  transactionCode: string;
  customerId: string;
  totalWeightKg: number;
  amount: number;
  paymentStatus: PAYMENT_STATUS;
  transactionDate: Date;
  paidAt: Date | null;
  createdById: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateSalesTransaction = {
  customerId: string;
  amount?: number;
  transactionDate?: Date | null;
  notes?: string | null;
  lineItems?: TCreateLineItemInput[];
};

export type TGetSalesTransactions = {
  paymentStatus?: PAYMENT_STATUS;
  customerId?: string;
  dateRange?: { startDate?: Date | null; endDate?: Date | null };
} & TPagination;
