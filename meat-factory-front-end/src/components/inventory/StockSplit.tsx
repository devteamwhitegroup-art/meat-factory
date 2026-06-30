"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PRODUCT_TYPE_MN } from "@/lib/format/enum";
import { formatNumber } from "@/lib/format/money";

// Tab-split inventory view. Server passes the already-fetched items; we
// partition client-side by productType so there's no extra round-trip.

type Item = {
  id: string;
  sku: string;
  productType: "MEAT" | "BYPRODUCT" | string;
  animalType?: string | null;
  byproductName?: string | null;
  quantityKg: number;
};

// Fixed palette so each animal type keeps the same colour across renders
// (matches the dashboard pie's visual language).
const ANIMAL_COLORS: Record<string, string> = {
  COW: "bg-rose-500",
  SHEEP: "bg-amber-500",
  HORSE: "bg-violet-500",
  GOAT: "bg-teal-500",
  CAMEL: "bg-sky-500",
};

// animalType → display name comes from the Animals catalogue (admin-editable),
// passed in by the server page. Falls back to the raw type code.
function meatLabel(i: Item, names: Record<string, string>): string {
  const t = i.animalType ?? "";
  return t ? `${names[t] ?? t} мах` : "—";
}

function byproductLabel(i: Item): string {
  return i.byproductName ?? "—";
}

export function StockSplit({
  items,
  animalNames,
}: {
  items: Item[];
  animalNames: Record<string, string>;
}) {
  const [tab, setTab] = useState<"meat" | "byproduct">("meat");

  const meat = items.filter((i) => i.productType === "MEAT");
  const byproduct = items.filter((i) => i.productType === "BYPRODUCT");

  const meatTotal = meat.reduce((s, i) => s + Number(i.quantityKg ?? 0), 0);
  const byTotal = byproduct.reduce((s, i) => s + Number(i.quantityKg ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="inline-flex w-full max-w-md rounded-md bg-muted p-1 text-sm">
        {(
          [
            {
              key: "meat",
              label: PRODUCT_TYPE_MN.MEAT,
              count: meat.length,
              total: meatTotal,
            },
            {
              key: "byproduct",
              label: PRODUCT_TYPE_MN.BYPRODUCT,
              count: byproduct.length,
              total: byTotal,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-sm px-3 py-1.5 text-center font-medium transition-colors",
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}{" "}
            <span className="text-xs text-muted-foreground">
              ({formatNumber(t.total)} кг)
            </span>
          </button>
        ))}
      </div>

      {tab === "meat" ? (
        <MeatPanel items={meat} total={meatTotal} animalNames={animalNames} />
      ) : (
        <ByproductPanel items={byproduct} total={byTotal} />
      )}
    </div>
  );
}

// ─── Meat tab ────────────────────────────────────────────────────────

function MeatPanel({
  items,
  total,
  animalNames,
}: {
  items: Item[];
  total: number;
  animalNames: Record<string, string>;
}) {
  // Sort animals descending by kg so the largest segment is on the left
  // of the proportional bar.
  const sorted = [...items]
    .map((i) => ({
      ...i,
      kg: Number(i.quantityKg ?? 0),
      label: meatLabel(i, animalNames),
      color: ANIMAL_COLORS[i.animalType ?? ""] ?? "bg-slate-400",
    }))
    .sort((a, b) => b.kg - a.kg);
  const nonZero = sorted.filter((i) => i.kg > 0);

  return (
    <div className="space-y-4">
      {/* ── Proportional stacked bar ── */}
      {total > 0 ? (
        <div className="space-y-3">
          <div className="flex h-6 w-full overflow-hidden rounded-md border bg-muted">
            {nonZero.map((i) => (
              <div
                key={i.id}
                className={cn(i.color, "h-full")}
                style={{ width: `${(i.kg / total) * 100}%` }}
                title={`${i.label}: ${formatNumber(i.kg)} кг`}
              />
            ))}
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {nonZero.map((i) => {
              const pct = (i.kg / total) * 100;
              return (
                <li key={i.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn("inline-block h-3 w-3 rounded-sm", i.color)}
                  />
                  <span className="flex-1">{i.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(i.kg)} кг
                  </span>
                  <span className="w-12 text-right tabular-nums text-xs text-muted-foreground">
                    {pct.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Махны нөөц алга
        </div>
      )}

      {/* ── Detailed table ── */}
      {sorted.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Мал</TableHead>
                <TableHead className="text-right">Үлдэгдэл</TableHead>
                <TableHead className="w-32">Хувь</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((i) => {
                const pct = total > 0 ? (i.kg / total) * 100 : 0;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                    <TableCell className="font-medium">{i.label}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatNumber(i.kg)} кг
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(i.color, "h-full")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}

// ─── Byproduct tab ───────────────────────────────────────────────────

function ByproductPanel({ items, total }: { items: Item[]; total: number }) {
  // Sort descending by kg; byproducts are usually long-tail named items so
  // a simple ranked list is more useful than a stacked bar.
  const sorted = [...items]
    .map((i) => ({
      ...i,
      kg: Number(i.quantityKg ?? 0),
      label: byproductLabel(i),
    }))
    .sort((a, b) => b.kg - a.kg);

  if (sorted.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Дайвар нөөц алга
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Дайвар</TableHead>
            <TableHead className="text-right">Үлдэгдэл</TableHead>
            <TableHead className="w-32">Хувь</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((i) => {
            const pct = total > 0 ? (i.kg / total) * 100 : 0;
            return (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                <TableCell className="font-medium">{i.label}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatNumber(i.kg)} кг
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
