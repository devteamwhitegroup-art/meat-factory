// A single load on the cargo manifest — matches the storekeeper's notebook
// layout: `seq - pieces - product - gross - tare = net`.
//
//   pieceCount (ш)        : how many cuts / boxes in this load
//   productLabel          : Cyrillic free-form (Адууны мах / Хацар мах / A / B …)
//   grossKg (бохир жин)   : raw scale reading before tare subtraction
//   tareKg (сав жин)      : packaging / paper weight
//   weightKg (цэвэр)      : net = grossKg − tareKg (computed in the controller)
//
// pieceCount / grossKg / tareKg are nullable so legacy "quick add"
// (label + net weight only) still works — when gross+tare are both null the
// FE just shows weightKg as the canonical figure.
export type TShipmentCargoEntry = {
  id: string;
  shipmentId: string;
  productLabel: string;
  pieceCount: number | null;
  grossKg: number | null;
  tareKg: number | null;
  weightKg: number;
  // Buyer-side price negotiated AT LOADING (separate from the herder's
  // weighing-entry price). Nullable for legacy rows + the "load now, price
  // later" flow.
  pricePerKg: number | null;
  sequenceNo: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TCreateShipmentCargoEntry = {
  shipmentId: string;
  productLabel: string;
  pieceCount?: number | null;
  grossKg?: number | null;
  tareKg?: number | null;
  // Direct net weight — only required when grossKg/tareKg aren't supplied.
  weightKg?: number | null;
  pricePerKg?: number | null;
};

export type TUpdateShipmentCargoEntryPrice = {
  id: string;
  pricePerKg: number | null;
};
