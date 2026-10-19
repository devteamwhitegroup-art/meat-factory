import { TPagination } from "../global/global.type";
import { PRODUCT_TYPE } from "../sales/sales-transaction.type";

// Factory → factory shipment (no customer, no invoice). The sender's stock
// leaves when it's sent (IN_TRANSIT); the receiver's stock grows when they
// confirm (RECEIVED). Cancelling in transit returns it to the sender.
export enum FACTORY_TRANSFER_STATUS {
  IN_TRANSIT = "IN_TRANSIT",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

export type TFactoryTransfer = {
  id: string;
  // TR-YYYYMMDD-N
  code: string;
  fromFactory: string;
  toFactory: string;
  status: FACTORY_TRANSFER_STATUS;
  notes: string | null;
  sentById: string;
  // Who received (RECEIVED) or cancelled (CANCELLED), and when.
  closedById: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// What left the sender, snapshotted so the receiver's IN needs no lookup.
export type TFactoryTransferLine = {
  id: string;
  transferId: string;
  productType: PRODUCT_TYPE;
  animalId: string | null;
  byproductName: string | null;
  quantityKg: number;
  quantityCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateFactoryTransfer = {
  // Cross-factory roles pick; staff send from their own.
  fromFactory?: string | null;
  toFactory: string;
  // Picked from the sender's stock rows; kg and/or pieces.
  lines: {
    inventoryItemId: string;
    quantityKg?: number | null;
    quantityCount?: number | null;
  }[];
  notes?: string | null;
};

export type TGetFactoryTransfers = {
  status?: FACTORY_TRANSFER_STATUS;
  // Cross-factory roles: transfers from or to this factory.
  factory?: string;
} & TPagination;
