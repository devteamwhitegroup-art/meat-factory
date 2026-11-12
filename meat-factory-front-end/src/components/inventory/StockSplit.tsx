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
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
import { EmptyState } from "@/components/common/ListState";
import { PRODUCT_TYPE_MN } from "@/lib/format/enum";
import { formatNumber } from "@/lib/format/money";
import { productLabel } from "@/lib/format/product";
import { CHART_COLORS } from "@/components/dashboard/BreakdownPie";

// Tab-split inventory view. Server passes the already-fetched items; we
// partition client-side by productType so there's no extra round-trip.

type Item = {
  id: string;
  sku: string;
  productType: "MEAT" | "BYPRODUCT" | string;
  animalType?: string | null;
  byproductName?: string | null;
  quantityKg: number;
  // Pieces — counted гэдэс (kg unknown until the byproduct factory weighs it).
  quantityCount?: number;
  // Counted гэдэс × catalogue constants: organs it should yield.
  expected?: { name: string; count: number; kg: number | null }[];
};

const label = (i: Item) =>
  productLabel(i.productType, i.animalType, i.byproductName) || "—";

export function StockSplit({
  items,
  countOnly = false,
}: {
  items: Item[];
  // Үйлдвэр 1/2 нярав: byproducts as piece counts only (no kg).
  countOnly?: boolean;
}) {
  const [tab, setTab] = useState<"meat" | "byproduct">("meat");

  const meat = items.filter((i) => i.productType === "MEAT");
  const byproduct = items.filter((i) => i.productType === "BYPRODUCT");

  const meatTotal = meat.reduce((s, i) => s + Number(i.quantityKg ?? 0), 0);
  const byTotal = byproduct.reduce((s, i) => s + Number(i.quantityKg ?? 0), 0);
  const byCount = byproduct.reduce((s, i) => s + (i.quantityCount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className={SEGMENTED}>
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
              pieces: byCount,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={segmentCls(tab === t.key)}
          >
            {t.label}{" "}
            <span className="text-xs opacity-75">
              {countOnly && "pieces" in t
                ? `(${t.pieces} ш)`
                : `(${formatNumber(t.total)} кг${
                    "pieces" in t && t.pieces > 0 ? ` · ${t.pieces} ш` : ""
                  })`}
            </span>
          </button>
        ))}
      </div>

      {tab === "meat" ? (
        <MeatPanel items={meat} total={meatTotal} />
      ) : (
        <ByproductPanel
          items={byproduct}
          total={countOnly ? byCount : byTotal}
          countOnly={countOnly}
        />
      )}
    </div>
  );
}

// ─── Meat tab ────────────────────────────────────────────────────────

function MeatPanel({ items, total }: { items: Item[]; total: number }) {
  // Sort animals descending by kg so the largest segment is on the left
  // of the proportional bar; colour by rank, like the dashboard pie.
  const sorted = [...items]
    .map((i) => ({ ...i, kg: Number(i.quantityKg ?? 0), label: label(i) }))
    .sort((a, b) => b.kg - a.kg)
    .map((i, n) => ({ ...i, color: CHART_COLORS[n % CHART_COLORS.length] }));
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
                className="h-full"
                style={{
                  width: `${(i.kg / total) * 100}%`,
                  backgroundColor: i.color,
                }}
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
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: i.color }}
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
        <EmptyState>Махны нөөц алга</EmptyState>
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
                            className="h-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: i.color,
                            }}
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

function ByproductPanel({
  items,
  total,
  countOnly,
}: {
  items: Item[];
  // kg total, or piece total when countOnly.
  total: number;
  countOnly: boolean;
}) {
  // Sort descending by kg (pieces when countOnly); byproducts are usually
  // long-tail named items so a ranked list beats a stacked bar.
  const sorted = [...items]
    .map((i) => ({
      ...i,
      kg: Number(i.quantityKg ?? 0),
      label: label(i),
    }))
    .filter((i) => !countOnly || (i.quantityCount ?? 0) > 0)
    .sort((a, b) =>
      countOnly
        ? (b.quantityCount ?? 0) - (a.quantityCount ?? 0)
        : b.kg - a.kg || (b.quantityCount ?? 0) - (a.quantityCount ?? 0),
    );

  if (sorted.length === 0) {
    return <EmptyState>Дайвар нөөц алга</EmptyState>;
  }
  const showExpected = sorted.some((i) => i.expected?.length);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Дайвар</TableHead>
            <TableHead className="text-right">Үлдэгдэл</TableHead>
            {showExpected ? <TableHead>Хүлээгдэх гарц</TableHead> : null}
            <TableHead className="w-32">Хувь</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((i) => {
            const expectedKg = i.expected?.some((e) => e.kg != null)
              ? i.expected.reduce((s, e) => s + (e.kg ?? 0), 0)
              : null;
            const amount = countOnly ? (i.quantityCount ?? 0) : i.kg;
            const pct = total > 0 ? (amount / total) * 100 : 0;
            return (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                <TableCell className="font-medium">{i.label}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {countOnly
                    ? `${i.quantityCount ?? 0} ш`
                    : [
                        (i.quantityCount ?? 0) > 0
                          ? `${i.quantityCount} ш`
                          : null,
                        i.kg > 0 || !i.quantityCount
                          ? `${formatNumber(i.kg)} кг`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </TableCell>
                {showExpected ? (
                  <TableCell className="text-sm">
                    {i.expected?.length ? (
                      <>
                        {expectedKg != null ? (
                          <div className="font-medium tabular-nums">
                            ≈ {formatNumber(expectedKg)} кг
                          </div>
                        ) : null}
                        <div className="text-xs whitespace-normal text-muted-foreground tabular-nums">
                          {i.expected
                            .map(
                              (e) =>
                                `${e.name} ${formatNumber(e.count)} ш${
                                  e.kg != null
                                    ? ` · ${formatNumber(e.kg)} кг`
                                    : ""
                                }`,
                            )
                            .join(", ")}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ) : null}
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
