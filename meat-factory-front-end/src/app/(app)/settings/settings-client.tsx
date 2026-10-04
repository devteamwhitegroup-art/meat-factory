"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { PlusIcon, PrinterIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDoc, UpdateSettingsDoc } from "@/lib/queries/settings";
import { EnqueuePrinterTestDoc } from "@/lib/queries/print";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

// id is null until the row is saved (backend assigns it).
type PrinterRow = { id: string | null; name: string; ip: string };

type Form = {
  meatCapacityKg: string;
  exportAlertThresholdKg: string;
  domesticAlertThresholdKg: string;
  printers: PrinterRow[];
};

export function SettingsClient() {
  const { data, loading, refetch } = useQuery(SettingsDoc, {
    fetchPolicy: "cache-and-network",
  });
  const [save] = useMutation(UpdateSettingsDoc);
  const [testPrint] = useMutation(EnqueuePrinterTestDoc);
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
          printers: compact(s.printers).map((p) => ({
            id: p.id ?? null,
            name: p.name ?? "",
            ip: p.ip ?? "",
          })),
        }
      : null);

  function setPrinter(i: number, patch: Partial<PrinterRow>) {
    if (!effective) return;
    setForm({
      ...effective,
      printers: effective.printers.map((p, j) =>
        j === i ? { ...p, ...patch } : p,
      ),
    });
  }

  // Test slip goes to the saved IP — save first after editing a row.
  async function onTest(printerKey: string) {
    setBusy(true);
    await runMutation(
      async () =>
        (await testPrint({ variables: { printerKey } })).data
          ?.enqueuePrinterTest,
      { success: "Тест хэвлэлт илгээлээ" },
    );
    setBusy(false);
  }

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
              printers: effective.printers.map((p) => ({
                id: p.id,
                name: p.name,
                ip: p.ip,
              })),
            },
          })
        ).data?.updateSettings,
      {
        success: "Хадгалагдлаа",
        // Drop local edits so new printers pick up their server ids.
        onSuccess: async () => {
          await refetch();
          setForm(null);
        },
      },
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

      <Card className="sm:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Принтер</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {effective.printers.map((p, i) => (
            <div key={p.id ?? `new-${i}`} className="flex flex-wrap gap-2">
              <Input
                aria-label="Принтерийн нэр"
                placeholder="Нэр (ж: Агуулах)"
                value={p.name}
                onChange={(e) => setPrinter(i, { name: e.target.value })}
                className="h-11 min-w-40 flex-1"
              />
              <Input
                aria-label="IP хаяг"
                placeholder="192.168.1.50"
                inputMode="decimal"
                value={p.ip}
                onChange={(e) => setPrinter(i, { ip: e.target.value })}
                className="h-11 min-w-40 flex-1 tabular-nums"
              />
              {p.id ? (
                <Button
                  variant="outline"
                  className="h-11 gap-2"
                  disabled={busy}
                  onClick={() => onTest(p.id!)}
                >
                  <PrinterIcon className="size-4" />
                  Тест
                </Button>
              ) : null}
              <Button
                variant="ghost"
                className="h-11"
                aria-label="Устгах"
                onClick={() =>
                  setForm({
                    ...effective,
                    printers: effective.printers.filter((_, j) => j !== i),
                  })
                }
              >
                <Trash2Icon className="text-destructive" />
              </Button>
              {p.id ? (
                <p className="w-full select-all font-mono text-xs text-muted-foreground">
                  ID: {p.id}
                </p>
              ) : null}
            </div>
          ))}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              setForm({
                ...effective,
                printers: [
                  ...effective.printers,
                  { id: null, name: "", ip: "" },
                ],
              })
            }
          >
            <PlusIcon className="size-4" />
            Принтер нэмэх
          </Button>
          <p className="text-xs text-muted-foreground">
            Ажилтан хэвлэхдээ эндээс принтер сонгоно. IP нь тогтмол байх ёстой.
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
