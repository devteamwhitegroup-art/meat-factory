'use client';

import { useMutation, useQuery } from 'urql';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShipmentDetailDoc,
  UpdateShipmentStatusDoc,
} from '@/lib/queries/shipment';
import { unwrap } from '@/lib/urql/unwrap';
import { SHIPMENT_STATUS_MN, PAYMENT_STATUS_MN } from '@/lib/format/enum';
import { formatNumber, formatMNT } from '@/lib/format/money';
import { fmtDate, fmtDateTime } from '@/lib/format/date';
import { cn } from '@/lib/utils';

const STEPS: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'Хүлээгдэж буй' },
  { value: 'LOADED', label: 'Ачигдсан' },
  { value: 'DELIVERED', label: 'Хүргэгдсэн' },
];

const NEXT: Record<string, string | null> = {
  PENDING: 'LOADED',
  LOADED: 'DELIVERED',
  DELIVERED: null,
};

export function ShipmentDetailClient({ id }: { id: string }) {
  const [{ data, fetching }, refetch] = useQuery({
    query: ShipmentDetailDoc,
    variables: { id },
    requestPolicy: 'cache-and-network',
  });
  const [, updateStatus] = useMutation(UpdateShipmentStatusDoc);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  const s = data?.shipment?.shipment;
  if (!s) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const stepIdx = STEPS.findIndex((x) => x.value === s.status);
  const nextStatus = NEXT[s.status ?? ''] ?? null;

  async function advance() {
    if (!nextStatus) return;
    try {
      const r = await updateStatus({
        id,
        status: nextStatus as never,
      });
      unwrap(r.data?.updateShipmentStatus);
      toast.success('Төлөв шинэчлэгдлээ');
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Ачилтын код</div>
          <h1 className="font-mono text-2xl font-semibold">
            {s.shipmentCode}
          </h1>
        </div>
        <Badge className="border-0 bg-primary/10 text-primary">
          {SHIPMENT_STATUS_MN[s.status ?? ''] ?? s.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {STEPS.map((step, i) => (
              <div key={step.value} className="flex flex-1 items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                    i <= stepIdx
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </div>
                <div className="text-sm">{step.label}</div>
                {i < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      'h-px flex-1',
                      i < stepIdx ? 'bg-emerald-300' : 'bg-muted',
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
          {nextStatus ? (
            <div className="mt-4 flex justify-end">
              <Button onClick={advance}>
                {SHIPMENT_STATUS_MN[nextStatus] ?? nextStatus} болгох
              </Button>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground">
              Дууссан ачилт.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Харилцагч</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Нэр</div>
            <div>{s.customer?.name ?? '—'}</div>
            <div className="text-muted-foreground">Утас</div>
            <div>{s.customer?.contactPhone ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Дэлгэрэнгүй</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Жин</div>
            <div>{formatNumber(s.weightKg)} кг</div>
            <div className="text-muted-foreground">Үүсгэсэн</div>
            <div>{fmtDate(s.createdAt)}</div>
            {s.shippedAt ? (
              <>
                <div className="text-muted-foreground">Хүргэсэн</div>
                <div>{fmtDateTime(s.shippedAt)}</div>
              </>
            ) : null}
            {s.notes ? (
              <>
                <div className="text-muted-foreground">Тэмдэглэл</div>
                <div>{s.notes}</div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {s.salesTransaction ? (
        <Card>
          <CardHeader>
            <CardTitle>Холбоотой гүйлгээ</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Код</div>
            <div className="font-mono">{s.salesTransaction.transactionCode}</div>
            <div className="text-muted-foreground">Дүн</div>
            <div>{formatMNT(s.salesTransaction.amount)}</div>
            <div className="text-muted-foreground">Төлбөр</div>
            <div>
              {PAYMENT_STATUS_MN[s.salesTransaction.paymentStatus ?? ''] ??
                s.salesTransaction.paymentStatus}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
