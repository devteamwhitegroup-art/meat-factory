import { TDateRange, TPagination } from '../global/global.type';

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
  animalType: string | null;
  // Free-form byproduct name from the byproduct catalogue (BYPRODUCT lines).
  byproductName: string | null;
  quantityKg: number;
  // Null on a line auto-created from an unpriced shipment sale-line group —
  // filled in later via SalesTransactionController.setLineItemPrice. Always
  // set immediately on the manual createSalesTransaction path.
  unitPrice: number | null;
  lineAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateLineItemInput = {
  productType: PRODUCT_TYPE;
  animalType?: string | null;
  byproductName?: string | null;
  quantityKg: number;
  unitPrice: number;
};

export type TSalesTransaction = {
  id: string;
  transactionCode: string;
  customerId: string;
  // Set when this invoice was auto-created from a delivered shipment
  // (ShipmentController.updateStatus → SalesTransactionController.
  // createFromShipment). Null for manually-created transactions.
  shipmentId: string | null;
  totalWeightKg: number;
  // Null until every line item is priced — see TSalesLineItem.unitPrice and
  // SalesTransactionController.setLineItemPrice/_recomputeAmount.
  amount: number | null;
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
  dateRange?: TDateRange;
} & TPagination;
