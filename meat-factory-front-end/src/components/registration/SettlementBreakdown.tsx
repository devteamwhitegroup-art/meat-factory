"use client";

import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compact } from "@/lib/compact";
import { formatNumber } from "@/lib/format/money";

type Line = {
  animalType?: string | null;
  receivedWeightKg?: number | null;
  pricePerKg?: number | null;
  meatAmount?: number | null;
  byproductAmount?: number | null;
  slaughterCost?: number | null;
};

// A settlement's money — the stored `settlement` or the backend's
// `settlementPreview` (same shape). Display only: every figure comes from the
// backend's one settlement formula, nothing is recomputed here.
export type Breakdown = {
  lines?: (Line | null)[] | null;
  totalMeatAmount?: number | null;
  totalByproductAmount?: number | null;
  totalSlaughterCost?: number | null;
  netPayable?: number | null;
};

// `itemized` sits between the table and the totals (e.g. the гэдэс list);
// `children` are extra rows appended to the totals grid (paid / held …).
export function SettlementBreakdown({
  s,
  itemized,
  children,
  hideByproductColumn = false,
}: {
  s: Breakdown;
  itemized?: ReactNode;
  children?: ReactNode;
  // The гэдэс take is still being answered — lines don't carry it yet.
  hideByproductColumn?: boolean;
}) {
  const lines = compact(s.lines);
  // A column only when it carries money (pre-butchered has no бой зардал).
  const showByproduct = Number(s.totalByproductAmount ?? 0) > 0;
  const byproductColumn = showByproduct && !hideByproductColumn;
  const showSlaughter = Number(s.totalSlaughterCost ?? 0) > 0;
  const received = lines.reduce(
    (sum, l) => sum + Number(l.receivedWeightKg ?? 0),
    0,
  );

  return (
    <div className="space-y-3 text-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Төрөл</TableHead>
            <TableHead className="text-right">Хүлээн авсан (кг)</TableHead>
            <TableHead className="text-right">Дундаж үнэ / кг</TableHead>
            <TableHead className="text-right">Махны дүн</TableHead>
            {byproductColumn && (
              <TableHead className="text-right">Дайвар</TableHead>
            )}
            {showSlaughter && (
              <TableHead className="text-right">Бой зардал</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((l) => (
            <TableRow key={l.animalType ?? ""}>
              <TableCell>{l.animalType}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(l.receivedWeightKg)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {Number(l.pricePerKg ?? 0) > 0
                  ? formatNumber(l.pricePerKg)
                  : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(l.meatAmount)}
              </TableCell>
              {byproductColumn && (
                <TableCell className="text-right tabular-nums">
                  {formatNumber(l.byproductAmount)}
                </TableCell>
              )}
              {showSlaughter && (
                <TableCell className="text-right tabular-nums">
                  {formatNumber(l.slaughterCost)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {itemized}
      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        <div className="text-muted-foreground">Нийт хүлээн авсан</div>
        <div className="text-right tabular-nums">
          {formatNumber(received)} кг
        </div>
        <div className="text-muted-foreground">Нийт мах</div>
        <div className="text-right tabular-nums">
          {formatNumber(s.totalMeatAmount)}
        </div>
        {showByproduct && (
          <>
            <div className="text-muted-foreground">Дайвар</div>
            <div className="text-right tabular-nums">
              +{formatNumber(s.totalByproductAmount)}
            </div>
          </>
        )}
        {showSlaughter && (
          <>
            <div className="text-muted-foreground">Бой зардал</div>
            <div className="text-right tabular-nums">
              −{formatNumber(s.totalSlaughterCost)}
            </div>
          </>
        )}
        <div className="text-base font-semibold">Малчинд өгөх дүн</div>
        <div className="text-right text-base font-semibold tabular-nums">
          {formatNumber(s.netPayable)}
        </div>
        {children}
      </div>
    </div>
  );
}
