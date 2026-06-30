import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BreakdownPie } from "@/components/dashboard/BreakdownPie";
import { MonthlyOverviewChart } from "@/components/dashboard/MonthlyOverviewChart";
import { getClient } from "@/lib/apollo/server";
import { DashboardDoc } from "@/lib/queries/dashboard";
import { compact } from "@/lib/compact";
import { PAYMENT_STATUS_MN, SHIPMENT_STATUS_MN } from "@/lib/format/enum";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { fmtDate } from "@/lib/format/date";
import { parseRange, thisMonth } from "@/lib/date/range";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";

import { requireCap } from "@/lib/auth/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireCap("dashboard");
  const sp = await searchParams;
  const def = thisMonth();
  const { data } = await getClient().query({
    query: DashboardDoc,
    variables: { dateRange: parseRange(sp.from ?? def.from, sp.to ?? def.to) },
  });
  const wrap = data?.dashboard;
  if (!wrap?.success || !wrap.dashboard) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        {wrap?.message ?? "Тайлан ачаалж чадсангүй"}
      </div>
    );
  }
  const d = wrap.dashboard;
  const animalSlices = compact(d.animalBreakdown).map((a) => ({
    name: a.animalType ?? "",
    value: Number(a.totalKg ?? 0),
  }));
  const byprodSlices = compact(d.byproductBreakdown).map((b) => ({
    name: b.name ?? "",
    value: Number(b.totalKg ?? 0),
  }));
  const txns = compact(d.recentTransactions);
  const ships = compact(d.recentShipments);
  const pipe = d.pipeline;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Тайлан</h1>
        <DateRangeFilter />
      </div>

      {/* Pipeline tile — clickable shortcuts into the matching /registrations
          stage chips. Adds at-a-glance pipeline visibility to the dashboard. */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Бүртгэлийн урсгал</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              href="/registrations?stage=registered"
              className="rounded-md border bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-900/40"
            >
              <div className="text-xs text-muted-foreground">Бүртгэгдсэн</div>
              <div className="text-2xl font-semibold tabular-nums">
                {pipe?.registered ?? 0}
              </div>
            </Link>
            <Link
              href="/registrations?stage=in_process"
              className="rounded-md border bg-blue-50 p-3 transition-colors hover:bg-blue-100 dark:bg-blue-950/30"
            >
              <div className="text-xs text-muted-foreground">
                Дүн тооцоолж буй
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {pipe?.inProcess ?? 0}
              </div>
            </Link>
            <Link
              href="/registrations?stage=payment_pending"
              className="rounded-md border bg-amber-50 p-3 transition-colors hover:bg-amber-100 dark:bg-amber-950/30"
            >
              <div className="text-xs text-muted-foreground">
                Төлбөр хүлээгдэж буй
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {pipe?.paymentPending ?? 0}
              </div>
            </Link>
            <Link
              href="/registrations?stage=paid"
              className="rounded-md border bg-emerald-50 p-3 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30"
            >
              <div className="text-xs text-muted-foreground">
                Төлбөр хийгдсэн
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {pipe?.paid ?? 0}
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Махны орлого" value={formatMNT(d.totalMeatIncome)} />
        <MetricCard
          label="Малчдад төлсөн"
          value={formatMNT(d.totalHerderIncome)}
        />
        <MetricCard
          label="Хүлээгдэж буй төлбөр"
          value={formatMNT(d.pendingPayoutAmount)}
          accent="amber"
        />
        <MetricCard
          label="Идэвхтэй малчид"
          value={String(d.activeHerderCount ?? 0)}
        />
        <MetricCard
          label="Гүйлгээний тоо"
          value={String(d.transactionCount ?? 0)}
        />
        <MetricCard
          label="Хүлээгдэж буй гүйлгээ"
          value={String(d.pendingServicesCount ?? 0)}
          accent="amber"
        />
        <MetricCard
          label="Дайвар (кг, гарт өгсөн)"
          value={formatNumber(d.totalByproductKg) + " кг"}
        />
      </div>

      <MonthlyOverviewChart monthsBack={12} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownPie
          title="Малын задаргаа"
          data={animalSlices}
          emptyText="Махны борлуулалт алга"
        />
        <BreakdownPie
          title="Дайвар задаргаа (гарт өгсөн)"
          data={byprodSlices}
          emptyText="Дайвар хүлээлгэн өгөөгүй"
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
                        {t.customer?.name ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.transactionCode}
                      </span>
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(t.transactionDate)}
                    </span>
                    <span className="ml-3 text-right">
                      {formatMNT(t.amount)}
                    </span>
                    <Badge
                      className={
                        "ml-3 border-0 " +
                        (t.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800")
                      }
                    >
                      {PAYMENT_STATUS_MN[t.paymentStatus ?? ""] ??
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
                        {s.customer?.name ?? "—"}
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
                      {SHIPMENT_STATUS_MN[s.status ?? ""] ?? s.status}
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
