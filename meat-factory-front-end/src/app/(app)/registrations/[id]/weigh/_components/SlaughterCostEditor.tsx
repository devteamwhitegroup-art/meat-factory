"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetRegistrationSlaughterCostsDoc } from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";

type Line = {
  animalType: string;
  count: number;
  slaughterCost: number | null;
};

// Per-animal-type "Бой зардал" capture. Saved at weigh time so the figure is
// fixed before verification; settlement later pre-fills from it. Locked once
// the registration is VERIFIED+ (the server rejects it anyway).
export function SlaughterCostEditor({
  registrationId,
  editable,
  lines,
  onChanged,
}: {
  registrationId: string;
  editable: boolean;
  lines: Line[];
  onChanged: () => void;
}) {
  const [save, { loading }] = useMutation(SetRegistrationSlaughterCostsDoc);

  // Distinct animal types (sum counts + any stored cost across duplicate lines).
  const types = useMemo(() => {
    const m = new Map<string, { count: number; cost: number | null }>();
    for (const l of lines) {
      const cur = m.get(l.animalType) ?? { count: 0, cost: null };
      cur.count += l.count;
      if (l.slaughterCost != null) cur.cost = (cur.cost ?? 0) + l.slaughterCost;
      m.set(l.animalType, cur);
    }
    return Array.from(m.entries()).map(([animalType, v]) => ({
      animalType,
      count: v.count,
      cost: v.cost,
    }));
  }, [lines]);

  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      types.map((t) => [t.animalType, t.cost != null ? String(t.cost) : ""]),
    ),
  );

  async function onSave() {
    const input = types.map((t) => {
      const n = Number(vals[t.animalType]);
      return {
        animalType: t.animalType,
        slaughterCost: Number.isFinite(n) && n > 0 ? n : 0,
      };
    });
    if (input.some((l) => l.slaughterCost < 0)) {
      toast.error("Бой зардал сөрөг байж болохгүй");
      return;
    }
    await runMutation(
      async () =>
        (await save({ variables: { registrationId, lines: input } })).data
          ?.setRegistrationSlaughterCosts,
      { success: "Бой зардал хадгалагдлаа", onSuccess: onChanged },
    );
  }

  if (types.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бой зардал</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <div key={t.animalType} className="space-y-1.5">
              <Label className="text-xs">
                {t.animalType} ({t.count})
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                value={vals[t.animalType] ?? ""}
                onChange={(e) =>
                  setVals((s) => ({ ...s, [t.animalType]: e.target.value }))
                }
                placeholder="₮"
                className="h-11 text-right tabular-nums"
                disabled={!editable || loading}
              />
            </div>
          ))}
        </div>
        {editable ? (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={loading}>
              {loading ? "..." : "Бой зардал хадгалах"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Баталгаажсан тул бой зардлыг өөрчлөх боломжгүй.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
