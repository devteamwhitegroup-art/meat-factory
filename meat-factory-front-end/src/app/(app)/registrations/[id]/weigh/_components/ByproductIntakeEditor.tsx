"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMNT } from "@/lib/format/money";

type Bundle = {
  wrapperId?: string | null;
  constantId?: string | null;
  name?: string | null;
  animalType?: string | null;
  count?: number | null;
  unitPrice?: number | null;
};

// Unsaved edits per row (item or whole wrapper id); untouched fields keep
// the BE value.
export type IntakeEdits = Record<string, { count?: string; price?: string }>;

// A row is a single item (constantId) or a whole гэдэс (wrapperId).
const rowKey = (b: Bundle) => (b.constantId ?? b.wrapperId)!;

// setRegistrationByproducts input: every row, edits over the saved/default
// values.
export function intakeInputs(bundles: Bundle[], edits: IntakeEdits) {
  return bundles.map((b) => {
    const e = edits[rowKey(b)] ?? {};
    return {
      wrapperId: b.constantId ? null : b.wrapperId,
      constantId: b.constantId ?? null,
      count: Number(e.count ?? b.count ?? 0) || 0,
      unitPrice: Number(e.price ?? b.unitPrice ?? 0) || 0,
    };
  });
}

// Хойд үйлдвэр receiving: count the byproducts (whole гэдэс or single
// items) delivered with the pre-butchered meat. Items + default prices come from the site's price list
// (Систем тохиргоо › Үйлдвэр); the receiver may change a price to today's
// market. "Finish weighing" saves pending edits first.
export function ByproductIntakeEditor({
  bundles,
  edits,
  editable,
  busy,
  onChange,
  onSave,
}: {
  bundles: Bundle[];
  edits: IntakeEdits;
  editable: boolean;
  busy: boolean;
  onChange: (edits: IntakeEdits) => void;
  // Omitted on the intake form, which saves with the registration.
  onSave?: () => void;
}) {
  if (bundles.length === 0) return null;
  const dirty = Object.keys(edits).length > 0;
  const set = (id: string, patch: { count?: string; price?: string }) =>
    onChange({ ...edits, [id]: { ...edits[id], ...patch } });
  const total = intakeInputs(bundles, edits).reduce(
    (s, b) => s + b.count * b.unitPrice,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Дайвар</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="hidden grid-cols-[1fr_6rem_8rem] gap-3 px-1 text-xs text-muted-foreground sm:grid">
          <span>Нэр</span>
          <span className="text-right">Тоо</span>
          <span className="text-right">Нэгж үнэ (₮)</span>
        </div>
        {bundles.map((b) => {
          const id = rowKey(b);
          const e = edits[id] ?? {};
          return (
            <div
              key={id}
              className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[1fr_6rem_8rem]"
            >
              <div className="col-span-2 sm:col-span-1">
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-muted-foreground">
                  {b.animalType}
                </div>
              </div>
              <Input
                aria-label={`${b.name} тоо`}
                inputMode="numeric"
                value={e.count ?? String(b.count ?? 0)}
                onChange={(ev) =>
                  set(id, { count: ev.target.value.replace(/\D/g, "") })
                }
                className="h-11 text-right tabular-nums"
                disabled={!editable || busy}
              />
              <Input
                aria-label={`${b.name} үнэ`}
                inputMode="decimal"
                value={e.price ?? String(b.unitPrice ?? 0)}
                onChange={(ev) =>
                  set(id, { price: ev.target.value.replace(/[^\d.]/g, "") })
                }
                className="h-11 text-right tabular-nums"
                disabled={!editable || busy}
              />
            </div>
          );
        })}
        <div className="flex justify-between border-t pt-2 text-sm font-semibold">
          <span>Дайварын дүн</span>
          <span className="tabular-nums">{formatMNT(total)}</span>
        </div>
        {!editable ? (
          <p className="text-xs text-muted-foreground">
            Жин бүртгэл дууссан тул дайврын тоо, үнийг өөрчлөх боломжгүй.
          </p>
        ) : onSave ? (
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={onSave}
              disabled={busy || !dirty}
            >
              Дайвар хадгалах
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
