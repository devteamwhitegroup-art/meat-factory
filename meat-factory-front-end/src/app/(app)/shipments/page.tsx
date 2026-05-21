import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getClient } from '@/lib/apollo/server';
import { ShipmentListDoc } from '@/lib/queries/shipment';
import { compact } from '@/lib/compact';
import { SHIPMENT_STATUS_MN } from '@/lib/format/enum';
import { formatNumber } from '@/lib/format/money';
import { fmtDate } from '@/lib/format/date';

const TABS = [
  { value: '', label: 'Бүгд' },
  { value: 'PENDING', label: 'Хүлээгдэж буй' },
  { value: 'LOADED', label: 'Ачигдсан' },
  { value: 'DELIVERED', label: 'Хүргэгдсэн' },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'border-0 bg-slate-200 text-slate-800',
  LOADED: 'border-0 bg-amber-100 text-amber-800',
  DELIVERED: 'border-0 bg-emerald-100 text-emerald-800',
};

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

export default async function ShipmentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status =
    sp.status && TABS.some((t) => t.value === sp.status) ? sp.status : null;
  const page = Number(sp.page) || 1;
  const { data } = await getClient().query({
    query: ShipmentListDoc,
    variables: { status: status as never, limit: 20, page },
  });
  const rows = compact(data?.shipments?.shipments);
  const count = data?.shipments?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Ачилт</h1>
        <Link href="/shipments/new" className={buttonVariants()}>
          Шинэ ачилт
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = (status ?? '') === t.value;
          const href = t.value ? `/shipments?status=${t.value}` : '/shipments';
          return (
            <Link
              key={t.value}
              href={href}
              className={
                'rounded-full border px-3 py-1 text-xs transition-colors ' +
                (active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted')
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Ачилт олдсонгүй
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Харилцагч</TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Гүйлгээ</TableHead>
                <TableHead>Жин</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id!}>
                  <TableCell className="font-medium">
                    {s.customer?.name ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.shipmentCode}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.salesTransaction?.transactionCode ?? '—'}
                  </TableCell>
                  <TableCell>{formatNumber(s.weightKg)} кг</TableCell>
                  <TableCell>{fmtDate(s.shippedAt ?? s.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      className={STATUS_COLOR[s.status ?? ''] ?? 'border-0 bg-muted'}
                    >
                      {SHIPMENT_STATUS_MN[s.status ?? ''] ?? s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/shipments/${s.id}`}
                      className="text-primary underline"
                    >
                      Дэлгэрэнгүй
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-xs text-muted-foreground">Нийт: {count}</div>
    </div>
  );
}
