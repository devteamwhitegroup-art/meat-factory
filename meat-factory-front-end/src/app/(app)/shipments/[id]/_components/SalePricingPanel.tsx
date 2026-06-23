'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SetShipmentSalePriceDoc } from '@/lib/queries/shipment';
import { runMutation } from '@/lib/runMutation';
import { ANIMAL_MN, PRODUCT_TYPE_MN } from '@/lib/format/enum';
import { formatNumber, formatMNT } from '@/lib/format/money';

// ─── End-of-load pricing ─────────────────────────────────────────────
//
// Sale lines are server-maintained — one per (productType, animalType /
// byproductName) group across the manifest. The FE never creates or deletes
// them; the storekeeper only enters a negotiated ₮/kg per line. Amount and the
// grand total are recomputed by the server on each price change.
export type SaleLineRow = {
  id: string;
  productType: string | null;
  animalType: string | null;
  byproductName: string | null;
  totalWeightKg: number;
  pricePerKg: number | null;
  amount: number | null;
};

function lineLabel(r: SaleLineRow): string {
  if (r.productType === 'MEAT') {
    return r.animalType ? (ANIMAL_MN[r.animalType] ?? r.animalType) : 'Мах';
  }
  return r.byproductName ?? PRODUCT_TYPE_MN.BYPRODUCT;
}

export function SalePricingPanel({
  saleLines,
  totalPrice,
  editable,
  onChanged,
}: {
  saleLines: SaleLineRow[];
  totalPrice: number | null;
  editable: boolean;
  onChanged: () => void;
}) {
  const [setPrice] = useMutation(SetShipmentSalePriceDoc);

  async function onSave(id: string, raw: string) {
    const trimmed = raw.trim();
    const next = trimmed ? Number(trimmed) : null;
    if (next != null && (!Number.isFinite(next) || next < 0)) {
      toast.error('Үнэ сөрөг байж болохгүй');
      return;
    }
    await runMutation(
      async () =>
        (await setPrice({ variables: { id, pricePerKg: next } })).data
          ?.setShipmentSalePrice,
      { onSuccess: onChanged },
    );
  }

  const unpriced = saleLines.filter((r) => r.pricePerKg == null).length;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Үнэ тооцоо</CardTitle>
        {unpriced > 0 ? (
          <Badge className="border-0 bg-amber-100 text-amber-800">
            Үнэ ороогүй {unpriced}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {saleLines.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Ачаа нэмэгдсэний дараа үнэ тооцох мөрүүд автоматаар үүснэ.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Төрөл</TableHead>
                  <TableHead className="text-right">Нийт жин (кг)</TableHead>
                  <TableHead className="text-right">Үнэ ₮/кг</TableHead>
                  <TableHead className="text-right">Дүн ₮</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleLines.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{lineLabel(r)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(r.totalWeightKg)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {editable ? (
                        <PriceCell
                          value={r.pricePerKg}
                          onSave={(next) => onSave(r.id, next)}
                        />
                      ) : r.pricePerKg != null ? (
                        formatNumber(r.pricePerKg)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {r.amount != null ? formatMNT(r.amount) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border-2 border-primary/40 bg-primary/5 px-3 py-2">
          <span className="text-base font-semibold">Нийт үнэ</span>
          <span className="text-base font-semibold tabular-nums">
            {totalPrice != null ? formatMNT(totalPrice) : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline ₮/kg editor — blur or ✓ saves; empty clears the price back to null.
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
        onBlur={async () => {
          await onSave(draft);
          setEditing(false);
        }}
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
    </div>
  );
}
