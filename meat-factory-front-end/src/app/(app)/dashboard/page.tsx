import Link from "next/link";
import {
  Banknote,
  Clock,
  HandCoins,
  Hourglass,
  Package,
  Receipt,
  Users,
} from "lucide-react";
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
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorNotice } from "@/components/common/ListState";
import { STATUS_STYLE } from "@/components/registration/StatusBadge";
import { cn } from "@/lib/utils";

import { requireCap } from "@/lib/auth/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireCap("DASHBOARD_VIEW");
  // Byproduct volumes are for whoever handles stock — not the money side.
  const showByproduct = session.can("INVENTORY_VIEW", "BYPRODUCT_PROCESS");
  const sp = await searchParams;
  const def = thisMonth();
  const { data } = await getClient().query({
    query: DashboardDoc,
    variables: { dateRange: parseRange(sp.from ?? def.from, sp.to ?? def.to) },
  });
  const wrap = data?.dashboard;
  if (!wrap?.success || !wrap.dashboard) {
    return <ErrorNotice message={wrap?.message ?? "Тайлан ачаалж чадсангүй"} />;
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
      <PageHeader
        title="Тайлан"
        description="Сонгосон хугацааны орлого, төлбөр, борлуулалтын тойм."
        actions={<DateRangeFilter />}
      />

      {/* Pipeline — each tile opens the matching /registrations filter. */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Бүртгэлийн урсгал</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Бүртгэгдсэн",
              value: pipe?.registered,
              href: "/registrations?stage=registered",
              style: STATUS_STYLE.REGISTERED,
            },
            {
              label: "Дүн тооцоолж буй",
              value: pipe?.inProcess,
              href: "/registrations?stage=in_process",
              style: STATUS_STYLE.WEIGHED,
            },
            {
              label: "Төлбөр хүлээгдэж буй",
              value: pipe?.paymentPending,
              href: "/registrations?stage=payment_pending",
              style: STATUS_STYLE.PAYMENT_PENDING,
            },
            {
              label: "Төлбөр хийгдсэн",
              value: pipe?.paid,
              href: "/registrations?stage=settled",
              style: STATUS_STYLE.SETTLED,
            },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:border-primary/50 hover:shadow-md"
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  t.style.cls,
                )}
              >
                <t.style.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-3xl font-bold tabular-nums">
                  {t.value ?? 0}
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                  {t.label}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Махны орлого"
          value={formatMNT(d.totalMeatIncome)}
          icon={Banknote}
        />
        <MetricCard
          label="Малчдад төлсөн"
          value={formatMNT(d.totalHerderIncome)}
          icon={HandCoins}
        />
        <MetricCard
          label="Хүлээгдэж буй төлбөр"
          value={formatMNT(d.pendingPayoutAmount)}
          accent="amber"
          icon={Clock}
        />
        <MetricCard
          label="Идэвхтэй малчид"
          value={String(d.activeHerderCount ?? 0)}
          icon={Users}
        />
        <MetricCard
          label="Гүйлгээний тоо"
          value={String(d.transactionCount ?? 0)}
          icon={Receipt}
        />
        <MetricCard
          label="Хүлээгдэж буй гүйлгээ"
          value={String(d.pendingServicesCount ?? 0)}
          accent="amber"
          icon={Hourglass}
        />
        {showByproduct ? (
          <MetricCard
            label="Дайвар (кг, гарт өгсөн)"
            value={formatNumber(d.totalByproductKg) + " кг"}
            icon={Package}
          />
        ) : null}
      </div>

      <MonthlyOverviewChart monthsBack={12} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownPie
          title="Малын задаргаа"
          data={animalSlices}
          emptyText="Махны борлуулалт алга"
        />
        {showByproduct ? (
          <BreakdownPie
            title="Дайвар задаргаа (гарт өгсөн)"
            data={byprodSlices}
            emptyText="Дайвар хүлээлгэн өгөөгүй"
          />
        ) : null}
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
                          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/12 text-amber-700 dark:text-amber-400")
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
