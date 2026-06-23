import { ANIMAL_TYPE } from '../livestock/registration.type';
import { PRODUCT_TYPE } from '../sales/sales-transaction.type';

// One priced product group on a shipment. Auto-derived from the cargo manifest:
// every distinct meat type / byproduct becomes a sale line whose totalWeightKg
// is kept in sync with its cargo entries. The end-of-load pricing screen shows
// each group's weight and lets the user insert a selling price per kg.
export type TShipmentSaleLine = {
  id: string;
  shipmentId: string;
  productType: PRODUCT_TYPE;
  // Set for MEAT groups (HORSE/COW/…); null for byproducts.
  animalType: ANIMAL_TYPE | null;
  // Set for BYPRODUCT groups (free-form name, e.g. "Адууны хэл"); null for meat.
  byproductName: string | null;
  // Dedup key within the shipment — "MEAT:<animalType>" or "BYPN:<name>".
  groupKey: string;
  // Sum of the group's cargo-entry net weights (synced on every manifest edit).
  totalWeightKg: number;
  // Selling price per kg, inserted at end of load. Nullable until agreed.
  pricePerKg: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TSetShipmentSalePrice = {
  id: string;
  pricePerKg: number | null;
};
