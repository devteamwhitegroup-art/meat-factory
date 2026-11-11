"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDecimalInput,
  formatMNT,
  sanitizeDecimalInput,
} from "@/lib/format/money";

type Bundle = {
  wrapperId?: string | null;
  constantId?: string | null;
  name?: string | null;
  animalType?: string | null;
  count?: number | null;
  unitPrice?: number | null;
};

// One count × price line. An item may have several (2 Арьс × 35,000 +
// 1 × 25,000); a line is a single item (constantId) or a whole гэдэс
// (wrapperId).
export type IntakeLine = Omit<Bundle, "count" | "unitPrice"> & {
  count: string;
  price: string;
};

// Unsaved edits: the whole line list once anything changed; null = the BE
// rows as they are. (Anything else — e.g. an old per-item draft — counts as
// untouched.)
export type IntakeEdits = IntakeLine[] | null;

export const intakeDirty = (edits: IntakeEdits) => Array.isArray(edits);

const itemKey = (l: Omit<Bundle, "count" | "unitPrice">) =>
  (l.constantId ?? l.wrapperId)!;

function linesOf(bundles: Bundle[], edits: IntakeEdits): IntakeLine[] {
  if (Array.isArray(edits)) return edits;
  return bundles.map(({ count, unitPrice, ...b }) => ({
    ...b,
    count: String(count ?? 0),
    price: String(unitPrice ?? 0),
  }));
}

// setRegistrationByproducts input: every item's first line (so the full list
// survives a save) plus any extra price line with a count.
export function intakeInputs(bundles: Bundle[], edits: IntakeEdits) {
  const seen = new Set<string>();
  return linesOf(bundles, edits)
    .filter((l) => {
      const first = !seen.has(itemKey(l));
      seen.add(itemKey(l));
      return first || Number(l.count) > 0;
    })
    .map((l) => ({
      wrapperId: l.constantId ? null : l.wrapperId,
      constantId: l.constantId ?? null,
      count: Number(l.count) || 0,
      unitPrice: Number(l.price) || 0,
    }));
}

// Хойд үйлдвэр receiving: count the byproducts (whole гэдэс or single
// items) delivered with the pre-butchered meat. Items + default prices come
// from the site's price list (Систем тохиргоо › Үйлдвэр); the receiver may
// change a price to today's market, and «Өөр үнэ» splits an item whose pieces
// were priced differently. "Finish weighing" saves pending edits first.
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
  const lines = linesOf(bundles, edits);
  const set = (i: number, patch: Partial<IntakeLine>) =>
    onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  // New line right after the item's last one, at the list price.
  const split = (i: number) => {
    const key = itemKey(lines[i]);
    let at = i;
    while (at + 1 < lines.length && itemKey(lines[at + 1]) === key) at++;
    const listPrice = bundles.find((b) => itemKey(b) === key)?.unitPrice ?? 0;
    onChange([
      ...lines.slice(0, at + 1),
      { ...lines[i], count: "", price: String(listPrice) },
      ...lines.slice(at + 1),
    ]);
  };
  const disabled = !editable || busy;
  const total = lines.reduce(
    (s, l) => s + (Number(l.count) || 0) * (Number(l.price) || 0),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Дайвар</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="hidden grid-cols-[1fr_6rem_8rem_7rem] gap-3 px-1 text-xs text-muted-foreground sm:grid">
          <span>Нэр</span>
          <span className="text-right">Тоо</span>
          <span className="text-right">Нэгж үнэ (₮)</span>
          <span />
        </div>
        {lines.map((l, i) => {
          // Extra price lines of the same item sit under it, without a name.
          const extra = i > 0 && itemKey(lines[i - 1]) === itemKey(l);
          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_7rem] items-center gap-3 sm:grid-cols-[1fr_6rem_8rem_7rem]"
            >
              <div className="col-span-3 sm:col-span-1">
                {extra ? (
                  <div className="pl-4 text-sm text-muted-foreground">
                    ↳ {l.name} — өөр үнээр
                  </div>
                ) : (
                  <>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.animalType}
                    </div>
                  </>
                )}
              </div>
              <Input
                aria-label={`${l.name} тоо`}
                inputMode="numeric"
                value={l.count}
                onChange={(ev) =>
                  set(i, { count: ev.target.value.replace(/\D/g, "") })
                }
                placeholder="0"
                className="h-11 text-right tabular-nums"
                disabled={disabled}
              />
              <Input
                aria-label={`${l.name} үнэ`}
                inputMode="decimal"
                value={formatDecimalInput(l.price)}
                onChange={(ev) =>
                  set(i, { price: sanitizeDecimalInput(ev.target.value) })
                }
                className="h-11 text-right tabular-nums"
                disabled={disabled}
              />
              {disabled ? (
                <span />
              ) : extra ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 gap-1 text-muted-foreground"
                  onClick={() => onChange(lines.filter((_, j) => j !== i))}
                >
                  <XIcon className="size-4" />
                  Хасах
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-1"
                  onClick={() => split(i)}
                >
                  <PlusIcon className="size-4" />
                  Өөр үнэ
                </Button>
              )}
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
              disabled={busy || !intakeDirty(edits)}
            >
              Дайвар хадгалах
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
