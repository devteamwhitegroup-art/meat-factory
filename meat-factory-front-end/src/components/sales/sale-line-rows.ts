import { compact } from "@/lib/compact";

// Plain (non-client) module so the server sales page can map rows too —
// a "use client" module's functions can't be called from the server.
export type SaleEntryRow = {
  id: string;
  weightKg: number;
  pricePerKg: number;
  amount: number;
  createdBy: string | null;
};

export type SaleLineRow = {
  id: string;
  productType: string | null;
  animalType: string | null;
  byproductName: string | null;
  totalWeightKg: number;
  soldKg: number;
  amount: number | null;
  entries: SaleEntryRow[];
};

// ShipmentDetailDoc sale lines → panel rows.
type SaleLineData = {
  id?: string | null;
  productType?: string | null;
  animalType?: string | null;
  byproductName?: string | null;
  totalWeightKg?: number | null;
  soldKg?: number | null;
  amount?: number | null;
  entries?: ReadonlyArray<{
    id?: string | null;
    weightKg?: number | null;
    pricePerKg?: number | null;
    amount?: number | null;
    createdBy?: { param?: string | null } | null;
  } | null> | null;
} | null;

export function toSaleLineRows(
  lines: ReadonlyArray<SaleLineData> | null | undefined,
): SaleLineRow[] {
  return compact(lines).map((l) => ({
    id: l.id!,
    productType: l.productType ?? null,
    animalType: l.animalType ?? null,
    byproductName: l.byproductName ?? null,
    totalWeightKg: Number(l.totalWeightKg ?? 0),
    soldKg: Number(l.soldKg ?? 0),
    amount: l.amount != null ? Number(l.amount) : null,
    entries: compact(l.entries).map((e) => ({
      id: e.id!,
      weightKg: Number(e.weightKg ?? 0),
      pricePerKg: Number(e.pricePerKg ?? 0),
      amount: Number(e.amount ?? 0),
      createdBy: e.createdBy?.param ?? null,
    })),
  }));
}
