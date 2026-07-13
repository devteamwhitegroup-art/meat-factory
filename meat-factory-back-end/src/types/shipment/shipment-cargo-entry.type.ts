import { PRODUCT_TYPE } from '../sales/sales-transaction.type';

// A single load on the cargo manifest — matches the storekeeper's notebook
// layout: `seq - pieces - product - gross - tare = net`.
//
//   productType           : MEAT (animalType) or BYPRODUCT (byproductName)
//   pieceCount (ш)        : how many cuts / boxes in this load
//   productLabel          : Cyrillic display label (defaults from the picked type)
//   grossKg (бохир жин)   : raw scale reading before tare subtraction
//   tareKg (сав жин)      : packaging / paper weight
//   weightKg (цэвэр)      : net = grossKg − tareKg (computed in the controller)
//
// pieceCount / grossKg / tareKg are nullable so a "quick add" (label + net
// weight only) still works — when gross+tare are both null the FE just shows
// weightKg as the canonical figure.
export type TShipmentCargoEntry = {
  id: string;
  shipmentId: string;
  productType: PRODUCT_TYPE;
  // MEAT line: the meat type. EXPORT is locked to HORSE; DOMESTIC allows any.
  // Null on BYPRODUCT lines (and on legacy rows).
  animalType: string | null;
  // BYPRODUCT line: free-form byproduct name (the inventory key). Null on meat.
  byproductName: string | null;
  // Optional traceability link to the byproduct catalogue entry the FE picked
  // (animal → wrapper → constant). Null on meat / free-typed byproducts.
  sourceConstantId: string | null;
  productLabel: string;
  pieceCount: number | null;
  grossKg: number | null;
  tareKg: number | null;
  weightKg: number;
  sequenceNo: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};
