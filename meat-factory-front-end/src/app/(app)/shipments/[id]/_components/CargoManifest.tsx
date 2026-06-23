"use client";

import { useMemo } from "react";
import { useMutation } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteCargoEntryDoc } from "@/lib/queries/shipment";
import { runMutation } from "@/lib/runMutation";
import { formatNumber } from "@/lib/format/money";
import { cn } from "@/lib/utils";

// ─── Cargo manifest ──────────────────────────────────────────────────
//
// Read-only-ish list of everything loaded, grouped by productLabel (the
// server defaults it from the picked meat/byproduct type). One row per load:
//   #  · ш (pieces) · Нийт махны жин · Сав жин · Цэвэр жин
// Per-group + grand totals match the storekeeper's notebook tally. Pricing is
// no longer per-line — see the sale-pricing panel below the manifest.
export type CargoRow = {
  id: string;
  productLabel: string;
  pieceCount: number | null;
  grossKg: number | null;
  tareKg: number | null;
  weightKg: number;
  sequenceNo: number;
  createdBy: string | null;
};

export function CargoManifest({
  entries,
  editable,
  onChanged,
}: {
  entries: CargoRow[];
  editable: boolean;
  onChanged: () => void;
}) {
  const [removeEntry] = useMutation(DeleteCargoEntryDoc);

  // Group by productLabel, preserve insertion order, compute per-group sums.
  const grouped = useMemo(() => {
    const m = new Map<string, CargoRow[]>();
    const order: string[] = [];
    for (const e of [...entries].sort((a, b) => a.sequenceNo - b.sequenceNo)) {
      if (!m.has(e.productLabel)) {
        m.set(e.productLabel, []);
        order.push(e.productLabel);
      }
      m.get(e.productLabel)!.push(e);
    }
    return order.map((lbl) => {
      const rows = m.get(lbl)!;
      return {
        productLabel: lbl,
        rows,
        pieceSubtotal: rows.reduce((s, r) => s + (r.pieceCount ?? 0), 0),
        weightSubtotal: rows.reduce((s, r) => s + r.weightKg, 0),
      };
    });
  }, [entries]);

  const grandPieces = grouped.reduce((s, g) => s + g.pieceSubtotal, 0);
  const grandWeight = grouped.reduce((s, g) => s + g.weightSubtotal, 0);

  async function onRemove(id: string) {
    if (!confirm("Энэ мөрийг устгах уу?")) return;
    await runMutation(
      async () =>
        (await removeEntry({ variables: { id } })).data?.deleteCargoEntry,
      { onSuccess: onChanged },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Ачааны жагсаалт</CardTitle>
        <Badge className="border-0 bg-primary/10 text-primary tabular-nums">
          Нийт {grandPieces}ш / {formatNumber(grandWeight)} кг
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {grouped.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Мөр алга. Дээрх «Ачаа нэмэх» хэсгээс бараа + жин оруулна уу.
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((g) => (
              <div key={g.productLabel} className="rounded-md border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
                  <div className="text-sm font-semibold">{g.productLabel}</div>
                  <Badge className="border bg-background text-foreground tabular-nums">
                    Нийт {g.pieceSubtotal}ш / {formatNumber(g.weightSubtotal)}{" "}
                    кг
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="text-right">ш</TableHead>
                      <TableHead className="text-right">
                        Нийт махны жин
                      </TableHead>
                      <TableHead className="text-right">Савны жин</TableHead>
                      <TableHead className="text-right">Цэвэр</TableHead>
                      <TableHead>Жинч</TableHead>
                      {editable ? <TableHead /> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.rows.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.pieceCount ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.grossKg != null ? formatNumber(r.grossKg) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.tareKg != null ? formatNumber(r.tareKg) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatNumber(r.weightKg)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.createdBy ?? "—"}
                        </TableCell>
                        {editable ? (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemove(r.id)}
                            >
                              Устгах
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-md border-2 px-3 py-2",
            grandWeight > 0
              ? "border-primary/40 bg-primary/5"
              : "border-muted bg-muted/20",
          )}
        >
          <span className="text-base font-semibold">Ерөнхий нийт</span>
          <span className="text-base font-semibold tabular-nums">
            {grandPieces}ш = {formatNumber(grandWeight)} кг
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
