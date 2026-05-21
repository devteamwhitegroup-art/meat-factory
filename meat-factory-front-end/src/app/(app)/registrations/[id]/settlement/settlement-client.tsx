'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/registration/StatusBadge';
import {
  SettlementPreview,
  type LineInput,
} from '@/components/registration/SettlementPreview';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreateSettlementDoc,
  MarkSettlementPaidDoc,
  RegistrationDetailDoc,
} from '@/lib/queries/registration';
import { unwrap } from '@/lib/urql/unwrap';
import { ANIMAL_MN, PAYMENT_STATUS_MN } from '@/lib/format/enum';
import { formatMNT, formatNumber } from '@/lib/format/money';
import { fmtDateTime } from '@/lib/format/date';
import { compact } from '@/lib/compact';

export function SettlementClient({ id }: { id: string }) {
  const [{ data, fetching }, refetch] = useQuery({
    query: RegistrationDetailDoc,
    variables: { id },
    requestPolicy: 'cache-and-network',
  });
  const [, createSettlement] = useMutation(CreateSettlementDoc);
  const [, markPaid] = useMutation(MarkSettlementPaidDoc);

  const reg = data?.registration?.registration;
  const types = useMemo(
    () => compact(reg?.animalLines).map((l) => l.animalType as string),
    [reg],
  );
  const receivedByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const w of compact(reg?.weighingEntries)) {
      m[w.animalType ?? ''] =
        (m[w.animalType ?? ''] ?? 0) + Number(w.weightKg ?? 0);
    }
    return m;
  }, [reg]);
  const byproductTotalWeight = useMemo(
    () =>
      compact(reg?.byproductLogs).reduce(
        (a, b) => a + Number(b.totalWeightKg ?? 0),
        0,
      ),
    [reg],
  );

  const [lines, setLines] = useState<LineInput[]>([]);
  const [notes, setNotes] = useState('');
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Initialise builder lines once registration loads.
  useMemo(() => {
    if (types.length && lines.length === 0 && !reg?.settlement) {
      setLines(
        types.map((t) => ({
          animalType: t,
          pricePerKg: '',
          slaughterCost: '',
          byproductPricePerKg: '',
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.length, reg?.settlement?.id]);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const existing = reg.settlement;

  async function onCreate() {
    for (const l of lines) {
      if (!Number(l.pricePerKg) || Number(l.pricePerKg) <= 0) {
        toast.error(
          `${ANIMAL_MN[l.animalType] ?? l.animalType}: үнэ оруулна уу`,
        );
        return;
      }
      if (Number(l.slaughterCost) < 0) {
        toast.error('Бой зардал сөрөг байж болохгүй');
        return;
      }
    }
    setBusy(true);
    try {
      const r = await createSettlement({
        registrationId: id,
        notes: notes.trim() || null,
        photoFileId: photoFileId ?? null,
        lines: lines.map((l) => ({
          animalType: l.animalType as never,
          pricePerKg: Number(l.pricePerKg),
          slaughterCost: l.slaughterCost ? Number(l.slaughterCost) : 0,
          byproductPricePerKg: l.byproductPricePerKg
            ? Number(l.byproductPricePerKg)
            : 0,
        })),
      });
      const created = unwrap(r.data?.createSettlement).settlement;
      if (!created) throw new Error('Хариу буцаасангүй');
      toast.success(
        `Тооцоо үүсгэгдлээ — цэвэр ${formatMNT(created.netPayable)}`,
      );
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onMarkPaid() {
    setBusy(true);
    try {
      const r = await markPaid({ registrationId: id });
      unwrap(r.data?.markSettlementPaid);
      toast.success('Төлбөр төлсөнд тэмдэглэгдлээ');
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Малчин</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-muted-foreground">Нэр</div>
          <div>{reg.herder?.name}</div>
          <div className="text-muted-foreground">Регистр</div>
          <div>{reg.herder?.registrationNo}</div>
          <div className="text-muted-foreground">Утас</div>
          <div>{reg.herder?.phone ?? '—'}</div>
          <div className="text-muted-foreground">Малчны данс</div>
          <div>{reg.herder?.bankAccount ?? '—'}</div>
          <div className="text-muted-foreground">Хаяг</div>
          <div>{reg.herder?.address}</div>
        </CardContent>
      </Card>

      {existing ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Тооцоо</CardTitle>
            <Badge
              className={
                existing.isPaid
                  ? 'border-0 bg-emerald-100 text-emerald-800'
                  : 'border-0 bg-amber-100 text-amber-800'
              }
            >
              {existing.isPaid
                ? PAYMENT_STATUS_MN.PAID
                : PAYMENT_STATUS_MN.PENDING}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Хүлээн авсан</TableHead>
                  <TableHead>Үнэ/кг</TableHead>
                  <TableHead>Мах</TableHead>
                  <TableHead>Дайвар</TableHead>
                  <TableHead>Бой зардал</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compact(existing.lines).map((l) => (
                  <TableRow key={l.id!}>
                    <TableCell>
                      {ANIMAL_MN[l.animalType ?? ''] ?? l.animalType}
                    </TableCell>
                    <TableCell>{formatNumber(l.receivedWeightKg)}</TableCell>
                    <TableCell>{formatMNT(l.pricePerKg)}</TableCell>
                    <TableCell>{formatMNT(l.meatAmount)}</TableCell>
                    <TableCell>{formatMNT(l.byproductAmount)}</TableCell>
                    <TableCell>{formatMNT(l.slaughterCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="text-muted-foreground">Нийт мах</div>
              <div className="text-right">{formatMNT(existing.totalMeatAmount)}</div>
              <div className="text-muted-foreground">Нийт дайвар</div>
              <div className="text-right">{formatMNT(existing.totalByproductAmount)}</div>
              <div className="text-muted-foreground">Бой зардал</div>
              <div className="text-right">{formatMNT(existing.totalSlaughterCost)}</div>
              <div className="font-medium">Нийт төлбөр</div>
              <div className="text-right font-medium">{formatMNT(existing.grossAmount)}</div>
              <div className="text-base font-semibold">Цэвэр төлбөр</div>
              <div className="text-right text-base font-semibold">
                {formatMNT(existing.netPayable)}
              </div>
              {existing.isPaid ? (
                <>
                  <div className="text-muted-foreground">Төлсөн</div>
                  <div className="text-right">
                    {fmtDateTime(existing.paidAt)}
                  </div>
                </>
              ) : null}
            </div>
            {!existing.isPaid && reg.status === 'VERIFIED' ? (
              <Button onClick={onMarkPaid} disabled={busy} className="w-full">
                {busy ? '...' : 'Төлбөр төлсөнд тэмдэглэх'}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          <SettlementPreview
            receivedByType={receivedByType}
            byproductTotalWeight={byproductTotalWeight}
            lines={lines}
            onChange={setLines}
          />
          <div className="space-y-3">
            <Textarea
              placeholder="Тэмдэглэл (заавал биш)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <PhotoUpload
              value={photoFileId}
              onChange={setPhotoFileId}
              type="settlement"
              label="Зураг / баримт (заавал биш)"
            />
            <Button
              onClick={onCreate}
              disabled={busy || reg.status !== 'VERIFIED'}
              className="w-full"
            >
              {busy ? '...' : 'Тооцоо үүсгэх'}
            </Button>
            {reg.status !== 'VERIFIED' ? (
              <div className="text-xs text-muted-foreground">
                Тооцоо үүсгэхийн тулд статус "Баталгаажсан" байх ёстой.
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
