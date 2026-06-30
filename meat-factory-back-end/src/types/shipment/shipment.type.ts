import { TPagination } from '../global/global.type';

export enum SHIPMENT_STATUS {
  PENDING = 'PENDING',
  LOADED = 'LOADED',
  DELIVERED = 'DELIVERED'
}

// Each truck/shipment is either EXPORT (abroad — horse meat only for now) or
// DOMESTIC (any meat type + byproducts). Drives the two shipment pages.
export enum SHIPMENT_CATEGORY {
  EXPORT = 'EXPORT',
  DOMESTIC = 'DOMESTIC'
}

// Sub-market for DOMESTIC shipments. ULAANBAATAR is the main domestic buyer;
// LOCAL (орон нутаг) buys on a much smaller scale. Null on EXPORT shipments.
export enum DOMESTIC_MARKET {
  LOCAL = 'LOCAL',
  ULAANBAATAR = 'ULAANBAATAR'
}

export type TShipment = {
  id: string;
  shipmentCode: string;
  category: SHIPMENT_CATEGORY;
  domesticMarket: DOMESTIC_MARKET | null;
  customerId: string | null;
  weightKg: number;
  // Cached grand total = Σ(sale-line weight × price). Nullable until any
  // group is priced. Derived from the sale lines, not set directly.
  totalPrice: number | null;
  pricedAt: Date | null;
  status: SHIPMENT_STATUS;
  shippedAt: Date | null;
  loadedById: string;
  // Truck / vehicle identifier copied from the storekeeper's notebook
  // (e.g. "УНО0223"). Optional — older shipments stay null.
  vehiclePlate: string | null;
  driverName: string | null;
  driverPhone: string | null;
  // Auto-incremented loading serial (assigned at create, like the
  // registration number). Not user-editable.
  serialNumber: number;
  notes: string | null;
  photoFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateShipment = {
  category: SHIPMENT_CATEGORY;
  // Required when category = DOMESTIC; ignored (forced null) for EXPORT.
  domesticMarket?: DOMESTIC_MARKET | null;
  // Required — every shipment is tied to a customer (create inline if new).
  customerId: string;
  // Optional — weight is derived from the cargo manifest (resynced on each
  // add/delete). Starts at 0 when omitted.
  weightKg?: number | null;
  vehiclePlate?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  notes?: string | null;
  photoFileId?: string | null;
};

export type TUpdateShipmentStatus = {
  id: string;
  status: SHIPMENT_STATUS;
};

export type TGetShipments = {
  status?: SHIPMENT_STATUS;
  category?: SHIPMENT_CATEGORY;
  domesticMarket?: DOMESTIC_MARKET;
  customerId?: string;
  dateRange?: { startDate?: Date | null; endDate?: Date | null };
} & TPagination;
