import { TPagination } from '../global/global.type';

export enum SHIPMENT_STATUS {
  PENDING = 'PENDING',
  LOADED = 'LOADED',
  DELIVERED = 'DELIVERED'
}

export type TShipment = {
  id: string;
  shipmentCode: string;
  customerId: string | null;
  salesTransactionId: string | null;
  weightKg: number;
  status: SHIPMENT_STATUS;
  shippedAt: Date | null;
  loadedById: string;
  notes: string | null;
  photoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateShipment = {
  customerId?: string | null;
  salesTransactionId?: string | null;
  weightKg: number;
  notes?: string | null;
  photoFileId?: string | null;
};

export type TUpdateShipmentStatus = {
  id: string;
  status: SHIPMENT_STATUS;
};

export type TGetShipments = {
  status?: SHIPMENT_STATUS;
  customerId?: string;
  salesTransactionId?: string;
  dateRange?: { startDate?: Date | null; endDate?: Date | null };
} & TPagination;
