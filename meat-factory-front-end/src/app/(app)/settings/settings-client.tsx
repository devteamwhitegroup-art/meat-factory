'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsDoc, UpdateSettingsDoc } from '@/lib/queries/settings';
import { unwrap } from '@/lib/unwrap';

type Form = {
  meatCapacityKg: string;
  meatAlertThresholdKg: string;
  cargoCapacityKg: string;
};

export function SettingsClient() {
  const { data, loading, refetch } = useQuery(SettingsDoc, {
    fetchPolicy: 'cache-and-network',
  });
  const [save] = useMutation(UpdateSettingsDoc);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const s = data?.settings?.settings;

  useEffect(() => {
    if (!s || form) return;
    setForm({
      meatCapacityKg: String(s.meatCapacityKg ?? 0),
      meatAlertThresholdKg: String(s.meatAlertThresholdKg ?? 0),
      cargoCapacityKg: String(s.cargoCapacityKg ?? 0),
    });
  }, [s, form]);

  async function onSave() {
    if (!form) return;
    const m = Number(form.meatCapacityKg);
    const t = Number(form.meatAlertThresholdKg);
    const c = Number(form.cargoCapacityKg);
    if ([m, t, c].some((n) => !Number.isFinite(n) || n < 0)) {
      toast.error('Утга сөрөг байж болохгүй');
      return;
    }
    if (t > 0 && m > 0 && t > m) {
      toast.error('Босго багтаамжаас их байж болохгүй');
      return;
    }
    setBusy(true);
    try {
      const r = await save({
        variables: {
          meatCapacityKg: m,
          meatAlertThresholdKg: t,
          cargoCapacityKg: c,
        },
      });
      unwrap(r.data?.updateSettings);
      toast.success('Хадгалагдлаа');
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !s) return <Skeleton className="h-48 w-full" />;
  if (!form) return null;

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
              value={form.meatCapacityKg}
              onChange={(e) =>
                setForm({ ...form, meatCapacityKg: e.target.value })
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
              value={form.meatAlertThresholdKg}
              onChange={(e) =>
                setForm({ ...form, meatAlertThresholdKg: e.target.value })
              }
              className="h-11 text-right tabular-nums"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Махны нөөц энэ хэмжээнээс давсан үед Telegram-аар мэдэгдэл явна.
            0 буюу хоосон үед мэдэгдэл унтраана.
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
              value={form.cargoCapacityKg}
              onChange={(e) =>
                setForm({ ...form, cargoCapacityKg: e.target.value })
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
          {busy ? '...' : 'Хадгалах'}
        </Button>
      </div>
    </div>
  );
}
