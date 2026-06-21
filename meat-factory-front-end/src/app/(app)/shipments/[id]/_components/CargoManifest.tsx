'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KeypadField } from '@/components/forms/KeypadField';
import {
  AddCargoEntryDoc,
  DeleteCargoEntryDoc,
  UpdateCargoEntryPriceDoc,
} from '@/lib/queries/shipment';
import { runMutation } from '@/lib/runMutation';
import { formatNumber, formatMNT } from '@/lib/format/money';
import { cn } from '@/lib/utils';

// ─── Cargo manifest v2 ───────────────────────────────────────────────
//
// Mirrors the storekeeper's notebook layout — one row per load with:
//   #  · ш (pieces) · Бохир жин · Тара жин · Цэвэр жин (computed)
// Rows are grouped by productLabel; each group shows piece + net totals;
// a grand total line at the bottom matches "Нийт 935ш = 25,591 кг".
// Net is computed live from gross−tare; if the storekeeper has only the
// net figure handy, leaving gross+tare blank still works.
export type CargoRow = {
  id: string;
  productLabel: string;
  pieceCount: number | null;
  grossKg: number | null;
  tareKg: number | null;
  weightKg: number;
  // Buyer-side price agreed at loading. May be null until the buyer commits.
  pricePerKg: number | null;
  sequenceNo: number;
  createdBy: string | null;
};

export function CargoManifest({
  shipmentId,
  status,
  entries,
  onChanged,
}: {
  shipmentId: string;
  status: string;
  entries: CargoRow[];
  onChanged: () => void;
}) {
  const [addEntry, { loading: adding }] = useMutation(AddCargoEntryDoc);
  const [removeEntry] = useMutation(DeleteCargoEntryDoc);
  const [updatePrice] = useMutation(UpdateCargoEntryPriceDoc);
  const [label, setLabel] = useState('');
  const [pieces, setPieces] = useState('');
  const [gross, setGross] = useState('');
  const [tare, setTare] = useState('');
  const [price, setPrice] = useState('');

  // Live net preview from gross − tare (so the user sees what'll be saved).
  const previewNet = useMemo(() => {
    const g = Number(gross);
    const t = Number(tare);
    if (
      Number.isFinite(g) &&
      g > 0 &&
      Number.isFinite(t) &&
      t >= 0 &&
      t < g
    ) {
      return Number((g - t).toFixed(2));
    }
    return null;
  }, [gross, tare]);

  const editable = status !== 'DELIVERED';

  // Group by productLabel, preserve insertion order, compute per-group
  // sums of pieces + net weight.
  const grouped = useMemo(() => {
    const m = new Map<string, CargoRow[]>();
    const order: string[] = [];
    for (const e of [...entries].sort(
      (a, b) => a.sequenceNo - b.sequenceNo,
    )) {
      if (!m.has(e.productLabel)) {
        m.set(e.productLabel, []);
        order.push(e.productLabel);
      }
      m.get(e.productLabel)!.push(e);
    }
    return order.map((lbl) => {
      const rows = m.get(lbl)!;
      const weightSubtotal = rows.reduce((s, r) => s + r.weightKg, 0);
      const amountSubtotal = rows.reduce(
        (s, r) => s + (r.pricePerKg != null ? r.weightKg * r.pricePerKg : 0),
        0,
      );
      // Weighted avg ₮/kg over the priced rows only — gives the buyer-facing
      // "average price for this whole-carcass type". Unpriced rows excluded.
      const pricedWeight = rows.reduce(
        (s, r) => s + (r.pricePerKg != null ? r.weightKg : 0),
        0,
      );
      const avgPrice = pricedWeight > 0 ? amountSubtotal / pricedWeight : null;
      return {
        productLabel: lbl,
        rows,
        pieceSubtotal: rows.reduce((s, r) => s + (r.pieceCount ?? 0), 0),
        weightSubtotal,
        amountSubtotal,
        avgPrice,
        unpricedRows: rows.filter((r) => r.pricePerKg == null).length,
      };
    });
  }, [entries]);

  const knownLabels = useMemo(
    () => Array.from(new Set(grouped.map((g) => g.productLabel))),
    [grouped],
  );

  const grandPieces = grouped.reduce((s, g) => s + g.pieceSubtotal, 0);
  const grandWeight = grouped.reduce((s, g) => s + g.weightSubtotal, 0);
  const grandAmount = grouped.reduce((s, g) => s + g.amountSubtotal, 0);
  const grandUnpriced = grouped.reduce((s, g) => s + g.unpricedRows, 0);

  async function onAdd() {
    const lbl = label.trim();
    if (!lbl) {
      toast.error('Барааны нэр оруулна уу');
      return;
    }
    const pcs = pieces.trim() ? Number(pieces) : null;
    const g = gross.trim() ? Number(gross) : null;
    const t = tare.trim() ? Number(tare) : null;
    const haveGrossTare = g != null && t != null;
    if (!haveGrossTare && previewNet == null) {
      toast.error('Бохир + Тара эсвэл цэвэр жин оруулна уу');
      return;
    }
    const priceTrim = price.trim();
    const priceNum = priceTrim ? Number(priceTrim) : null;
    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      toast.error('Үнэ сөрөг байж болохгүй');
      return;
    }
    await runMutation(
      async () =>
        (
          await addEntry({
            variables: {
              shipmentId,
              productLabel: lbl,
              pieceCount: pcs,
              grossKg: g,
              tareKg: t,
              // Send net only when gross/tare aren't supplied — BE prefers
              // gross-minus-tare when both are present.
              weightKg: haveGrossTare ? null : previewNet,
              pricePerKg: priceNum,
            },
          })
        ).data?.addCargoEntry,
      {
        onSuccess: () => {
          // Clear the weight + pieces fields but keep the label sticky so
          // multi-row entry for the same product is one-handed. Price is also
          // sticky — the storekeeper usually loads several rows at one agreed
          // ₮/kg figure, so don't force them to re-type it.
          setPieces('');
          setGross('');
          setTare('');
          onChanged();
        },
      },
    );
  }

  async function onPriceSave(id: string, raw: string) {
    const trimmed = raw.trim();
    const next = trimmed ? Number(trimmed) : null;
    if (next != null && (!Number.isFinite(next) || next < 0)) {
      toast.error('Үнэ сөрөг байж болохгүй');
      return;
    }
    await runMutation(
      async () =>
        (await updatePrice({ variables: { id, pricePerKg: next } })).data
          ?.updateCargoEntryPrice,
      { onSuccess: onChanged },
    );
  }

  async function onRemove(id: string) {
    if (!confirm('Энэ мөрийг устгах уу?')) return;
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
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="border-0 bg-primary/10 text-primary tabular-nums">
            Нийт {grandPieces}ш / {formatNumber(grandWeight)} кг
          </Badge>
          <Badge className="border-0 bg-emerald-100 text-emerald-800 tabular-nums">
            {formatMNT(grandAmount)}
          </Badge>
          {grandUnpriced > 0 ? (
            <Badge className="border-0 bg-amber-100 text-amber-800">
              Үнэ ороогүй {grandUnpriced}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Quick-add row matching the notebook column order ── */}
        {editable ? (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[2fr_repeat(4,minmax(0,1fr))_auto]">
              <div className="space-y-1.5">
                <Label className="text-xs">Бараа</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Адууны мах / Хацар мах ..."
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ш (тоо)</Label>
                <KeypadField
                  value={pieces}
                  onChange={setPieces}
                  label="ш (тоо)"
                  className="h-11 cursor-pointer text-right tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Бохир (кг)</Label>
                <KeypadField
                  value={gross}
                  onChange={setGross}
                  label="Бохир жин (кг)"
                  className="h-11 cursor-pointer text-right tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Тара (кг)</Label>
                <KeypadField
                  value={tare}
                  onChange={setTare}
                  label="Тара жин (кг)"
                  className="h-11 cursor-pointer text-right tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Үнэ (₮/кг)</Label>
                <KeypadField
                  value={price}
                  onChange={setPrice}
                  label="Үнэ (₮/кг)"
                  placeholder="заавал биш"
                  className="h-11 cursor-pointer text-right tabular-nums"
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="h-11 w-full"
                  onClick={onAdd}
                  disabled={adding}
                >
                  {adding ? '...' : 'Нэмэх'}
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Цэвэр жин:{' '}
              <span className="font-medium text-foreground tabular-nums">
                {previewNet != null ? `${formatNumber(previewNet)} кг` : '—'}
              </span>{' '}
              · Бохир − Тара. Зөвхөн цэвэр жинтэй бол Бохир/Тара хоосон үлдээ
              ба Тара талбарт цэвэр жинг бичээрэй. Үнэ нь ачилтын дараа
              тохиролцсон ₮/кг.
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Ачилт хүргэгдсэн тул жагсаалтыг өөрчлөх боломжгүй.
          </div>
        )}

        {/* ── Quick-pick chips ── */}
        {editable && knownLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {knownLabels.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setLabel(k)}
                className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs hover:bg-muted"
              >
                {k}
              </button>
            ))}
          </div>
        ) : null}

        {/* ── Grouped tables ── */}
        {grouped.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Мөр алга. Дээрх талбараас бараа + жин оруулна уу.
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((g) => (
              <div key={g.productLabel} className="rounded-md border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
                  <div className="text-sm font-semibold">{g.productLabel}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className="border bg-background text-foreground tabular-nums">
                      Нийт {g.pieceSubtotal}ш /{' '}
                      {formatNumber(g.weightSubtotal)} кг
                    </Badge>
                    {g.avgPrice != null ? (
                      <Badge className="border-0 bg-sky-100 text-sky-800 tabular-nums">
                        Дунд. {formatNumber(g.avgPrice)} ₮/кг
                      </Badge>
                    ) : null}
                    <Badge className="border-0 bg-primary/10 text-primary tabular-nums">
                      {formatMNT(g.amountSubtotal)}
                    </Badge>
                    {g.unpricedRows > 0 ? (
                      <Badge className="border-0 bg-amber-100 text-amber-800">
                        Үнэ ороогүй {g.unpricedRows}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="text-right">ш</TableHead>
                      <TableHead className="text-right">Бохир</TableHead>
                      <TableHead className="text-right">Тара</TableHead>
                      <TableHead className="text-right">Цэвэр</TableHead>
                      <TableHead className="text-right">Үнэ ₮/кг</TableHead>
                      <TableHead className="text-right">Дүн ₮</TableHead>
                      <TableHead>Жинч</TableHead>
                      {editable ? <TableHead /> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.rows.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.pieceCount ?? '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.grossKg != null ? formatNumber(r.grossKg) : '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.tareKg != null ? formatNumber(r.tareKg) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatNumber(r.weightKg)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {editable ? (
                            <PriceCell
                              value={r.pricePerKg}
                              onSave={(next) => onPriceSave(r.id, next)}
                            />
                          ) : r.pricePerKg != null ? (
                            formatNumber(r.pricePerKg)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {r.pricePerKg != null
                            ? formatMNT(r.weightKg * r.pricePerKg)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.createdBy ?? '—'}
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
            'flex flex-wrap items-center justify-between gap-2 rounded-md border-2 px-3 py-2',
            grandWeight > 0
              ? 'border-primary/40 bg-primary/5'
              : 'border-muted bg-muted/20',
          )}
        >
          <span className="text-base font-semibold">Ерөнхий нийт</span>
          <span className="text-base font-semibold tabular-nums">
            {grandPieces}ш = {formatNumber(grandWeight)} кг ·{' '}
            {formatMNT(grandAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline ₮/kg price editor — switches between a button-toggle display and an
// Input with Save/Cancel. Empty input clears the price back to null.
function PriceCell({
  value,
  onSave,
}: {
  value: number | null;
  onSave: (raw: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value != null ? String(value) : '');

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value != null ? String(value) : '');
          setEditing(true);
        }}
        className="font-mono tabular-nums hover:underline"
      >
        {value != null ? (
          formatNumber(value)
        ) : (
          <span className="text-muted-foreground">— нэмэх</span>
        )}
      </button>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Input
        autoFocus
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-8 w-24 text-right tabular-nums"
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={async () => {
          await onSave(draft);
          setEditing(false);
        }}
      >
        ✓
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setEditing(false)}
      >
        ✕
      </Button>
    </div>
  );
}
