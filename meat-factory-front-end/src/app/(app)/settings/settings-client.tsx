"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDoc, UpdateSettingsDoc } from "@/lib/queries/settings";
import { runMutation } from "@/lib/runMutation";

type Form = {
  meatCapacityKg: string;
  meatAlertThresholdKg: string;
  cargoCapacityKg: string;
};

export function SettingsClient() {
  const { data, loading, refetch } = useQuery(SettingsDoc, {
    fetchPolicy: "cache-and-network",
  });
  const [save] = useMutation(UpdateSettingsDoc);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const s = data?.settings?.settings;

  // Editable copy derived from the server snapshot. `form` holds the working
  // edits once the user changes a field; until then we render the server values
  // directly — no effect needed to seed state.
  const effective: Form | null =
    form ??
    (s
      ? {
          meatCapacityKg: String(s.meatCapacityKg ?? 0),
          meatAlertThresholdKg: String(s.meatAlertThresholdKg ?? 0),
          cargoCapacityKg: String(s.cargoCapacityKg ?? 0),
        }
      : null);

  async function onSave() {
    if (!effective) return;
    const m = Number(effective.meatCapacityKg);
    const t = Number(effective.meatAlertThresholdKg);
    const c = Number(effective.cargoCapacityKg);
    if ([m, t, c].some((n) => !Number.isFinite(n) || n < 0)) {
      toast.error("Утга сөрөг байж болохгүй");
      return;
    }
    if (t > 0 && m > 0 && t > m) {
      toast.error("Босго багтаамжаас их байж болохгүй");
      return;
    }
    setBusy(true);
    await runMutation(
      async () =>
        (
          await save({
            variables: {
              meatCapacityKg: m,
              meatAlertThresholdKg: t,
              cargoCapacityKg: c,
            },
          })
        ).data?.updateSettings,
      { success: "Хадгалагдлаа", onSuccess: refetch },
    );
    setBusy(false);
  }

  if (loading && !s) return <Skeleton className="h-48 w-full" />;
  if (!effective) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Нөөц багтаамж</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cap">Махны хадгалалтын багтаамж (кг)</Label>
            <Input
              id="cap"
              type="number"
              inputMode="decimal"
              value={effective.meatCapacityKg}
              onChange={(e) =>
                setForm({ ...effective, meatCapacityKg: e.target.value })
              }
              className="h-11 text-right tabular-nums"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Нөөц самбарт ашиглах хамгийн их хэмжээ.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Мэдэгдлийн босго</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="thr">Мэдэгдэх босго (кг)</Label>
            <Input
              id="thr"
              type="number"
              inputMode="decimal"
              value={effective.meatAlertThresholdKg}
              onChange={(e) =>
                setForm({ ...effective, meatAlertThresholdKg: e.target.value })
              }
              className="h-11 text-right tabular-nums"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Махны нөөц энэ хэмжээнээс давсан үед Telegram-аар мэдэгдэл явна. 0
            буюу хоосон үед мэдэгдэл унтраана.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ачааны багтаамж</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cargo">1 ачаа (кг)</Label>
            <Input
              id="cargo"
              type="number"
              inputMode="decimal"
              value={effective.cargoCapacityKg}
              onChange={(e) =>
                setForm({ ...effective, cargoCapacityKg: e.target.value })
              }
              className="h-11 text-right tabular-nums"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Нэг тээврийн машинд (рефрижератор гэх мэт) багтах хэмжээ. Нөөц
            хуудаснаас «Шинэ ачилт» дарахад энэ хэмжээгээр урьдчилан бөглөнө.
          </p>
        </CardContent>
      </Card>

      <div className="sm:col-span-2 lg:col-span-3">
        <Button onClick={onSave} disabled={busy} className="w-full sm:w-auto">
          {busy ? "..." : "Хадгалах"}
        </Button>
      </div>
    </div>
  );
}
