"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { formatMNT, formatNumber } from "@/lib/format/money";

export type IntakeWeighRow = {
  animalType: string;
  weightKg: string;
  pricePerKg: string;
};

export const EMPTY_WEIGH_ROW: IntakeWeighRow = {
  animalType: "",
  weightKg: "",
  pricePerKg: "",
};

// Хойд үйлдвэр intake: pre-butchered meat is weighed on the spot — one row per
// weighing (meat type, kg, ₮/kg). Several rows per type are fine.
export function IntakeWeighRows({
  value,
  onChange,
}: {
  value: IntakeWeighRow[];
  onChange: (rows: IntakeWeighRow[]) => void;
}) {
  const { animalTypes } = useAnimalCatalog();
  const rows = value.length > 0 ? value : [EMPTY_WEIGH_ROW];
  const set = (i: number, patch: Partial<IntakeWeighRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const totalKg = rows.reduce((s, r) => s + (Number(r.weightKg) || 0), 0);
  const totalAmount = rows.reduce(
    (s, r) => s + (Number(r.weightKg) || 0) * (Number(r.pricePerKg) || 0),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1fr_8rem_8rem_7rem_2rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
        <span>Мах</span>
        <span>Жин (кг)</span>
        <span>Үнэ (₮/кг)</span>
        <span className="text-right">Дүн</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[1fr_8rem_8rem_7rem_2rem]"
        >
          <select
            value={r.animalType}
            onChange={(e) => set(i, { animalType: e.target.value })}
            aria-label="Мах"
            className="col-span-2 h-12 rounded-md border bg-background px-3 text-base sm:col-span-1"
          >
            <option value="">Мах сонгох</option>
            {animalTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={r.weightKg}
            onChange={(e) => set(i, { weightKg: e.target.value })}
            placeholder="кг"
            aria-label="Жин (кг)"
            className="h-12 text-base tabular-nums"
          />
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            value={r.pricePerKg}
            onChange={(e) => set(i, { pricePerKg: e.target.value })}
            placeholder="₮/кг"
            aria-label="Үнэ (₮/кг)"
            className="h-12 text-base tabular-nums"
          />
          <div className="text-right text-sm tabular-nums">
            {formatMNT((Number(r.weightKg) || 0) * (Number(r.pricePerKg) || 0))}
          </div>
          <button
            type="button"
            aria-label="Мөр хасах"
            disabled={rows.length === 1}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="justify-self-end text-muted-foreground hover:text-destructive disabled:opacity-30"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-1"
          onClick={() => onChange([...rows, EMPTY_WEIGH_ROW])}
        >
          <PlusIcon className="size-4" />
          Мөр нэмэх
        </Button>
        <div className="text-sm tabular-nums">
          Нийт {formatNumber(totalKg)} кг ·{" "}
          <span className="font-semibold">{formatMNT(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
