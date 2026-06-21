'use client';

import { PencilIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fmtDateTime, fromNow } from '@/lib/format/date';
import { formatNumber } from '@/lib/format/money';

export type WeighingHistoryEntry = {
  id?: string | null;
  weightKg?: number | string | null;
  pricePerKg?: number | string | null;
  sequenceNo?: number | null;
  createdAt?: string | Date | null;
};

// Per-animal-type weigh history, newest first. Display numbers come from the
// parent (contiguous 1..n per type, so they stay stable after a delete);
// edit/delete are gated by `editable` and delegate back to the parent.
export function WeighingHistoryList({
  entries,
  displayNoById,
  editable,
  busy,
  onEdit,
  onRemove,
}: {
  entries: WeighingHistoryEntry[];
  displayNoById: Record<string, number>;
  editable: boolean;
  busy: boolean;
  onEdit: (entry: WeighingHistoryEntry, seq: number) => void;
  onRemove: (id: string, seq: number) => void;
}) {
  if (entries.length === 0) {
    return <div className="text-sm text-muted-foreground">Бичлэг алга</div>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {[...entries]
        .sort((a, b) => (b.sequenceNo ?? 0) - (a.sequenceNo ?? 0))
        .map((w) => {
          const seq = displayNoById[w.id!] ?? w.sequenceNo ?? 0;
          return (
            <li
              key={w.id!}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span className="font-medium">
                #{seq} · {formatNumber(w.weightKg)} кг
                {w.pricePerKg != null ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {formatNumber(w.pricePerKg)}₮/кг
                  </span>
                ) : null}
              </span>
              <div className="flex items-center gap-1">
                <span
                  className="mr-1 text-xs text-muted-foreground"
                  title={fmtDateTime(w.createdAt)}
                >
                  {fromNow(w.createdAt)}
                </span>
                {editable ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Засах"
                      disabled={busy}
                      onClick={() => onEdit(w, seq)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Устгах"
                      disabled={busy}
                      onClick={() => onRemove(w.id!, seq)}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
    </ul>
  );
}
