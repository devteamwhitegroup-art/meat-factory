'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { NumericKeypad } from '@/components/forms/NumericKeypad';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { StatusBadge } from '@/components/registration/StatusBadge';
import { ANIMAL_MN } from '@/lib/format/enum';
import { fmtDateTime, fromNow } from '@/lib/format/date';
import { formatNumber } from '@/lib/format/money';
import {
  AddWeighingEntryDoc,
  FinishWeighingDoc,
  RegistrationDetailDoc,
} from '@/lib/queries/registration';
import { unwrap } from '@/lib/unwrap';
import { compact } from '@/lib/compact';

export function WeighClient({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading: fetching, refetch } = useQuery(RegistrationDetailDoc, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const [addWeighing] = useMutation(AddWeighingEntryDoc);
  const [finishWeighing] = useMutation(FinishWeighingDoc);

  const reg = data?.registration?.registration;
  const types = useMemo(
    () => compact(reg?.animalLines).map((l) => l.animalType as string),
    [reg],
  );
  const [tab, setTab] = useState<string | null>(null);
  const activeTab = tab ?? types[0] ?? null;
  const [keypad, setKeypad] = useState('');
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (fetching && !reg) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!reg) {
    return (
      <div className="text-muted-foreground">Бүртгэл олдсонгүй.</div>
    );
  }

  async function submitWeight() {
    if (!activeTab) return;
    const w = Number(keypad);
    if (!w || w <= 0) return;
    setBusy(true);
    try {
      const r = await addWeighing({
        variables: {
          registrationId: id,
          animalType: activeTab as never,
          weightKg: w,
          photoFileId: photoFileId ?? null,
        },
      });
      unwrap(r.data?.addWeighingEntry);
      toast.success(`${formatNumber(w)} кг бүртгэгдлээ`);
      setKeypad('');
      setPhotoFileId(null);
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    try {
      const r = await finishWeighing({ variables: { registrationId: id } });
      unwrap(r.data?.finishWeighing);
      toast.success('Жин бүртгэл дууссан');
      router.push(`/registrations/${id}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  type W = ReturnType<typeof compact<NonNullable<NonNullable<typeof reg.weighingEntries>[number]>>>[number];
  const entriesByType: Record<string, W[]> = {};
  for (const w of compact(reg.weighingEntries)) {
    const t = w.animalType ?? '';
    if (!entriesByType[t]) entriesByType[t] = [];
    entriesByType[t].push(w);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Бүртгэлийн дугаар</div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">#{reg.registrationNumber}</h1>
            <StatusBadge status={reg.status} />
          </div>
        </div>
        <Button onClick={finish} disabled={busy || reg.status !== 'WEIGHING'}>
          Жинг бүртгэж дуусгах
        </Button>
      </div>

      <Tabs value={activeTab ?? ''} onValueChange={(v) => setTab(v)}>
        <TabsList>
          {types.map((t) => (
            <TabsTrigger key={t} value={t}>
              {ANIMAL_MN[t] ?? t}
            </TabsTrigger>
          ))}
        </TabsList>
        {types.map((t) => (
          <TabsContent key={t} value={t}>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Жин бүртгэл — {ANIMAL_MN[t] ?? t}</CardTitle>
                </CardHeader>
                <CardContent>
                  <NumericKeypad
                    value={keypad}
                    onChange={setKeypad}
                    onSubmit={submitWeight}
                    disabled={
                      busy ||
                      (reg.status !== 'REGISTERED' &&
                        reg.status !== 'WEIGHING')
                    }
                  />
                  <div className="mt-4">
                    <PhotoUpload
                      value={photoFileId}
                      onChange={setPhotoFileId}
                      type="scale"
                      label="Зураг (заавал биш)"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Түүх</CardTitle>
                </CardHeader>
                <CardContent>
                  {(entriesByType[t]?.length ?? 0) === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Бичлэг алга
                    </div>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {[...(entriesByType[t] ?? [])]
                        .sort(
                          (a, b) =>
                            (b.sequenceNo ?? 0) - (a.sequenceNo ?? 0),
                        )
                        .map((w) => (
                          <li
                            key={w.id!}
                            className="flex items-center justify-between rounded-md border px-3 py-2"
                          >
                            <span>
                              #{w.sequenceNo} · {formatNumber(w.weightKg)} кг
                            </span>
                            <span
                              className="text-xs text-muted-foreground"
                              title={fmtDateTime(w.createdAt)}
                            >
                              {fromNow(w.createdAt)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
