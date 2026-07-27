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
  exportAlertThresholdKg: string;
  domesticAlertThresholdKg: string;
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
          exportAlertThresholdKg: String(s.exportAlertThresholdKg ?? 0),
          domesticAlertThresholdKg: String(s.domesticAlertThresholdKg ?? 0),
        }
      : null);

  async function onSave() {
    if (!effective) return;
    const m = Number(effective.meatCapacityKg);
    const et = Number(effective.exportAlertThresholdKg);
    const dt = Number(effective.domesticAlertThresholdKg);
    if ([m, et, dt].some((n) => !Number.isFinite(n) || n < 0)) {
      toast.error("Утга сөрөг байж болохгүй");
      return;
    }
    setBusy(true);
    await runMutation(
      async () =>
        (
          await save({
            variables: {
              meatCapacityKg: m,
              exportAlertThresholdKg: et,
              domesticAlertThresholdKg: dt,
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
            <Label htmlFor="cap">Махны агуулахын багтаамж (кг)</Label>
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
          <CardTitle>Экспорт/дотоод мэдэгдэл</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="thr-export">Экспортын ачааны босго (кг)</Label>
            <Input
              id="thr-export"
              type="number"
              inputMode="decimal"
              value={effective.exportAlertThresholdKg}
              onChange={(e) =>
                setForm({
                  ...effective,
                  exportAlertThresholdKg: e.target.value,
                })
              }
              className="h-11 text-right tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="thr-domestic">Дотоод ачааны босго (кг)</Label>
            <Input
              id="thr-domestic"
              type="number"
              inputMode="decimal"
              value={effective.domesticAlertThresholdKg}
              onChange={(e) =>
                setForm({
                  ...effective,
                  domesticAlertThresholdKg: e.target.value,
                })
              }
              className="h-11 text-right tabular-nums"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Нөөцөд бүртгэгдсэн махны мэдэгдэл хүлээн авах хэсэг
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
