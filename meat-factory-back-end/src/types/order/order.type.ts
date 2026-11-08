import { TPagination } from "../global/global.type";

// Online retail order (landing page → QPay). PENDING = invoice issued, not
// paid yet. Staff move PAID → DELIVERED; PENDING may also be marked PAID by
// hand (paid outside QPay). DELIVERED / CANCELLED are final.
export enum ORDER_STATUS {
  PENDING = "PENDING",
  PAID = "PAID",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

// One meat cut inside a package, e.g. { name: "Үхрийн өвчүү", kg: 10 }.
export type TPackageItem = { name: string; kg: number | null };

export type TOrderPackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  items: TPackageItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateOrderPackage = {
  name: string;
  description?: string | null;
  price: number;
  items?: TPackageItem[] | null;
};

export type TUpdateOrderPackage = Partial<TCreateOrderPackage> & {
  id: string;
  isActive?: boolean;
};

// Snapshot of the package at order time — later package edits/deletes never
// change an existing order.
export type TOrderLine = {
  packageId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  items: TPackageItem[];
};

export type TOrder = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  address: string;
  note: string | null;
  lines: TOrderLine[];
  total: number;
  status: ORDER_STATUS;
  qpayInvoiceId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateOrder = {
  customerName: string;
  phone: string;
  address: string;
  note?: string | null;
  lines: { packageId: string; quantity: number }[];
};

export type TGetOrders = {
  status?: ORDER_STATUS;
  search?: string;
} & TPagination;
