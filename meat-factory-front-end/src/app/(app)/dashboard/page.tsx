import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { BreakdownPie } from '@/components/dashboard/BreakdownPie';
import { getClient } from '@/lib/apollo/server';
import { DashboardDoc } from '@/lib/queries/dashboard';
import { compact } from '@/lib/compact';
import {
  ANIMAL_MN,
  BYPRODUCT_MN,
  PAYMENT_STATUS_MN,
  SHIPMENT_STATUS_MN,
} from '@/lib/format/enum';
import { formatMNT, formatNumber } from '@/lib/format/money';
import { fmtDate } from '@/lib/format/date';

export default async function DashboardPage() {
  const { data } = await getClient().query({
    query: DashboardDoc,
    variables: { dateRange: null },
  });
  const wrap = data?.dashboard;
  if (!wrap?.success || !wrap.dashboard) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        {wrap?.message ?? 'Тайлан ачаалж чадсангүй'}
      </div>
    );
  }
  const d = wrap.dashboard;
  const animalSlices = compact(d.animalBreakdown).map((a) => ({
    name: ANIMAL_MN[a.animalType ?? ''] ?? a.animalType ?? '',
    value: Number(a.totalKg ?? 0),
  }));
  const byprodSlices = compact(d.byproductBreakdown).map((b) => ({
    name: BYPRODUCT_MN[b.byproductType ?? ''] ?? b.byproductType ?? '',
    value: Number(b.totalKg ?? 0),
  }));
  const txns = compact(d.recentTransactions);
  const ships = compact(d.recentShipments);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Тайлан</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Махны орлого"
          value={formatMNT(d.totalMeatIncome)}
        />
        <MetricCard
          label="Гүйлгээний тоо"
          value={String(d.transactionCount ?? 0)}
        />
        <MetricCard
          label="Малчдын орлого"
          value={formatMNT(d.totalHerderIncome)}
        />
        <MetricCard
          label="Идэвхтэй малчид"
          value={String(d.activeHerderCount ?? 0)}
        />
        <MetricCard
          label="Хүлээгдэж буй гүйлгээ"
          value={String(d.pendingServicesCount ?? 0)}
          accent="amber"
        />
        <MetricCard
          label="Дайвар (кг)"
          value={formatNumber(d.totalByproductKg) + ' кг'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownPie
          title="Малын задаргаа"
          data={animalSlices}
          emptyText="Махны борлуулалт алга"
        />
        <BreakdownPie
          title="Дайвар задаргаа"
          data={byprodSlices}
          emptyText="Дайварын борлуулалт алга"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Сүүлийн гүйлгээ</CardTitle>
          </CardHeader>
          <CardContent>
            {txns.length === 0 ? (
              <div className="text-sm text-muted-foreground">Гүйлгээ алга</div>
            ) : (
              <ul className="divide-y text-sm">
                {txns.map((t) => (
                  <li
                    key={t.id!}
                    className="flex items-center justify-between py-2"
                  >
                    <Link
                      href={`/sales/${t.id}`}
                      className="flex flex-1 items-center gap-2"
                    >
                      <span className="font-medium">
                        {t.customer?.name ?? '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.transactionCode}
                      </span>
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(t.transactionDate)}
                    </span>
                    <span className="ml-3 text-right">{formatMNT(t.amount)}</span>
                    <Badge
                      className={
                        'ml-3 border-0 ' +
                        (t.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800')
                      }
                    >
                      {PAYMENT_STATUS_MN[t.paymentStatus ?? ''] ??
                        t.paymentStatus}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сүүлийн ачилт</CardTitle>
          </CardHeader>
          <CardContent>
            {ships.length === 0 ? (
              <div className="text-sm text-muted-foreground">Ачилт алга</div>
            ) : (
              <ul className="divide-y text-sm">
                {ships.map((s) => (
                  <li
                    key={s.id!}
                    className="flex items-center justify-between py-2"
                  >
                    <Link
                      href={`/shipments/${s.id}`}
                      className="flex flex-1 items-center gap-2"
                    >
                      <span className="font-medium">
                        {s.customer?.name ?? '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.shipmentCode}
                      </span>
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(s.shippedAt ?? s.createdAt)}
                    </span>
                    <span className="ml-3 text-right">
                      {formatNumber(s.weightKg)} кг
                    </span>
                    <Badge className="ml-3 border-0 bg-primary/10 text-primary">
                      {SHIPMENT_STATUS_MN[s.status ?? ''] ?? s.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
