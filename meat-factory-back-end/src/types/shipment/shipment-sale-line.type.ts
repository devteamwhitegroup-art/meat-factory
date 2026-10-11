import { PRODUCT_TYPE } from '../sales/sales-transaction.type';

// One priced product group on a shipment. Auto-derived from the cargo manifest:
// every distinct meat type / byproduct becomes a sale line whose totalWeightKg
// is kept in sync with its cargo entries. The end-of-load pricing screen shows
// each group's weight; income comes from its sales-report lines (below).
export type TShipmentSaleLine = {
  id: string;
  shipmentId: string;
  productType: PRODUCT_TYPE;
  // Set for MEAT groups (HORSE/COW/…); null for byproducts.
  animalType: string | null;
  // Set for BYPRODUCT groups (free-form name, e.g. "Адууны хэл"); null for meat.
  byproductName: string | null;
  // Dedup key within the shipment — "MEAT:<animalType>" or
  // "BYPN:<animalType>:<name>" ("BYPN:<name>" for free-form / legacy cargo).
  groupKey: string;
  // Sum of the group's cargo-entry net weights (synced on every manifest edit).
  totalWeightKg: number;
  // Average selling price per kg over the salesman's report lines (synced);
  // null until something is reported.
  pricePerKg: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// One line of the salesman's sales report for a product group, entered after
// the shipment leaves (like a weighing entry): kg sold at a price. A group
// can have several (sold in parts at different prices).
export type TShipmentSaleEntry = {
  id: string;
  shipmentId: string;
  saleLineId: string;
  weightKg: number;
  pricePerKg: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};
