'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';
import { PencilIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { NumericKeypad } from '@/components/forms/NumericKeypad';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { StatusBadge } from '@/components/registration/StatusBadge';
import { ANIMAL_MN } from '@/lib/format/enum';
import { fmtDateTime, fromNow } from '@/lib/format/date';
import { formatNumber } from '@/lib/format/money';
import {
  AddWeighingEntryDoc,
  DeleteWeighingEntryDoc,
  FinishWeighingDoc,
  RegistrationDetailDoc,
  UpdateWeighingEntryDoc,
} from '@/lib/queries/registration';
import { unwrap } from '@/lib/unwrap';
import { compact } from '@/lib/compact';

function readRole(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)mf_role=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Mirrors the back-end rule: while weighing is in progress (REGISTERED) the
// scale operator may edit; once "fully uploaded" (WEIGHED / VERIFIED /
// PAYMENT_PENDING) only manager/admin may; after SETTLED/CANCELLED nobody may.
function canEditEntries(status: string, role: string | null): boolean {
  if (status === 'SETTLED' || status === 'CANCELLED') return false;
  const privileged =
    role === 'MANAGER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  if (
    status === 'WEIGHED' ||
    status === 'VERIFIED' ||
    status === 'PAYMENT_PENDING'
  )
    return privileged;
  // Open-window weigh edits: anyone on the floor except the gate guard.
  return (
    privileged ||
    role === 'SCALE' ||
    role === 'STOREKEEPER' ||
    role === 'MODERATOR'
  );
}

export function WeighClient({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading: fetching, refetch } = useQuery(RegistrationDetailDoc, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const [addWeighing] = useMutation(AddWeighingEntryDoc);
  const [finishWeighing] = useMutation(FinishWeighingDoc);
  const [updateWeighing] = useMutation(UpdateWeighingEntryDoc);
  const [deleteWeighing] = useMutation(DeleteWeighingEntryDoc);

  const [role, setRole] = useState<string | null>(null);
  useEffect(() => setRole(readRole()), []);

  const [editing, setEditing] = useState<{ id: string; seq: number } | null>(
    null,
  );
  const [editWeight, setEditWeight] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const reg = data?.registration?.registration;
  const types = useMemo(
    () => compact(reg?.animalLines).map((l) => l.animalType as string),
    [reg],
  );
  const [tab, setTab] = useState<string | null>(null);
  const activeTab = tab ?? types[0] ?? null;
  const [keypad, setKeypad] = useState('');
  // Last-entered price is remembered across entries of the same animal type
  // (operator doesn't re-type it for each animal). It's cleared automatically
  // when activeTab changes — each type is its own negotiation.
  const [price, setPrice] = useState('');
  useEffect(() => {
    setPrice('');
  }, [activeTab]);
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
    const p = Number(price);
    if (!p || p <= 0) {
      toast.error('Үнэ/кг оруулна уу');
      return;
    }
    setBusy(true);
    try {
      const r = await addWeighing({
        variables: {
          registrationId: id,
          animalType: activeTab as never,
          weightKg: w,
          pricePerKg: p,
          photoFileId: photoFileId ?? null,
        },
      });
      unwrap(r.data?.addWeighingEntry);
      toast.success(`${formatNumber(w)} кг · ${formatNumber(p)}₮/кг`);
      setKeypad('');
      // Keep `price` — same animal type usually shares the negotiated rate.
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

  async function saveEdit() {
    if (!editing) return;
    const w = Number(editWeight);
    if (!w || w <= 0) {
      toast.error('Жин 0-ээс их байх ёстой');
      return;
    }
    const p = editPrice.trim() ? Number(editPrice) : null;
    if (p != null && p <= 0) {
      toast.error('Үнэ 0-ээс их байх ёстой');
      return;
    }
    setBusy(true);
    try {
      const r = await updateWeighing({
        variables: { id: editing.id, weightKg: w, pricePerKg: p },
      });
      unwrap(r.data?.updateWeighingEntry);
      toast.success('Жин засагдлаа');
      setEditing(null);
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(entryId: string, seq: number) {
    if (!window.confirm(`#${seq} бичлэгийг устгах уу?`)) return;
    setBusy(true);
    try {
      const r = await deleteWeighing({ variables: { id: entryId } });
      unwrap(r.data?.deleteWeighingEntry);
      toast.success('Бичлэг устгагдлаа');
      await refetch();
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

  const editable = canEditEntries(reg.status ?? '', role);

  // Display numbering restarts at 1 per animal type (capture order), so it
  // stays contiguous even after a middle entry is removed.
  const displayNoById: Record<string, number> = {};
  for (const list of Object.values(entriesByType)) {
    [...list]
      .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
      .forEach((w, i) => {
        if (w.id) displayNoById[w.id] = i + 1;
      });
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
        {/* Finish only makes sense while still in REGISTERED with at least
            one entry recorded — afterwards the status is WEIGHED or beyond. */}
        <Button
          onClick={finish}
          disabled={
            busy ||
            reg.status !== 'REGISTERED' ||
            compact(reg.weighingEntries).length === 0
          }
        >
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
                      busy || reg.status !== 'REGISTERED'
                    }
                  />
                  <div className="mt-3 space-y-1.5">
                    <label className="text-sm font-medium">
                      Үнэ / кг (₮, хэлэлцсэн)
                    </label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="ж: 30000"
                      className="h-12 text-lg"
                      disabled={busy || reg.status !== 'REGISTERED'}
                    />
                  </div>
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
                            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                          >
                            <span className="font-medium">
                              #{displayNoById[w.id!] ?? w.sequenceNo} ·{' '}
                              {formatNumber(w.weightKg)} кг
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
                                    onClick={() => {
                                      setEditing({
                                        id: w.id!,
                                        seq:
                                          displayNoById[w.id!] ??
                                          w.sequenceNo ??
                                          0,
                                      });
                                      setEditWeight(String(w.weightKg ?? ''));
                                      setEditPrice(
                                        w.pricePerKg != null
                                          ? String(w.pricePerKg)
                                          : '',
                                      );
                                    }}
                                  >
                                    <PencilIcon />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Устгах"
                                    disabled={busy}
                                    onClick={() =>
                                      removeEntry(
                                        w.id!,
                                        displayNoById[w.id!] ??
                                          w.sequenceNo ??
                                          0,
                                      )
                                    }
                                  >
                                    <Trash2Icon className="text-destructive" />
                                  </Button>
                                </>
                              ) : null}
                            </div>
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

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Жин засах — #{editing?.seq}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Жин (кг)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="h-12 text-lg"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">
                Үнэ / кг (₮)
              </label>
              <Input
                type="number"
                inputMode="decimal"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(null)}
            >
              Болих
            </Button>
            <Button type="button" onClick={saveEdit} disabled={busy}>
              Хадгалах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
