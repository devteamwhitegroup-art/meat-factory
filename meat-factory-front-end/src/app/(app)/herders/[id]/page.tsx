import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/ListState";
import { LinkPaginationFooter } from "@/components/common/PaginationFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackButton } from "@/components/common/BackButton";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { requireCap } from "@/lib/auth/server";
import { getClient } from "@/lib/apollo/server";
import { HerderDetailDoc, HerderStatsDoc } from "@/lib/queries/herder";
import { RegistrationListDoc } from "@/lib/queries/registration";
import { compact } from "@/lib/compact";
import { unwrapList } from "@/lib/unwrap";
import { fmtDate } from "@/lib/format/date";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { getFactories } from "@/lib/factory/server";
import { factoryName } from "@/lib/factory/factories";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 20;

// Admin: one herder's profile, lifetime figures (what they brought in and
// were paid) and their registrations.
export default async function HerderDetailPage({
  params,
  searchParams,
}: Props) {
  await requireCap("HERDER_MANAGE");
  const factories = await getFactories();
  const { id } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const client = getClient();
  const [herderRes, statsRes, regsRes] = await Promise.all([
    client.query({ query: HerderDetailDoc, variables: { id } }),
    client.query({ query: HerderStatsDoc, variables: { id } }),
    client.query({
      query: RegistrationListDoc,
      variables: { herderId: id, limit: PAGE_SIZE, page },
    }),
  ]);
  const h = herderRes.data?.herder?.herder;
  if (!h) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        {herderRes.data?.herder?.message ?? "Малчин олдсонгүй"}
      </div>
    );
  }
  const s = statsRes.data?.herderStats?.stats;
  const { rows: regs, count } = unwrapList(
    regsRes.data?.registrations,
    regsRes.data?.registrations?.registrations,
  );
  const animals = compact(s?.animals);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <BackButton href="/herders" />
        <div>
          <h1 className="text-2xl font-semibold">{h.name}</h1>
          <div className="text-sm text-muted-foreground">
            {h.registrationNo} · {h.phone ?? "—"}
            {h.address ? ` · ${h.address}` : ""}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Бүртгэл"
          value={String(s?.registrationCount ?? 0)}
          hint={
            s?.lastIntakeDate
              ? `${fmtDate(s.firstIntakeDate)} — ${fmtDate(s.lastIntakeDate)}${
                  s.cancelledCount ? ` · цуцалсан ${s.cancelledCount}` : ""
                }`
              : "Бүртгэл алга"
          }
        />
        <MetricCard
          label="Нийт мал"
          value={formatNumber(animals.reduce((n, a) => n + (a.count ?? 0), 0))}
          hint={`${formatNumber(s?.weighedKg)} кг жинлэсэн`}
        />
        <MetricCard
          label="Махны дүн"
          value={formatMNT(s?.meatAmount)}
          hint={`Бой зардал ${formatMNT(s?.slaughterCost)} · дайвар ${formatMNT(s?.byproductAmount)}`}
        />
        <MetricCard
          label="Олгосон"
          value={formatMNT(s?.paidAmount)}
          hint={`Тооцоо ${s?.settlementCount ?? 0} · олгох ${formatMNT(s?.netPayable)}`}
          accent={Number(s?.unpaidAmount ?? 0) > 0 ? "amber" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Малын төрлөөр</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {animals.length === 0 ? (
              <div className="text-muted-foreground">Мал бүртгэгдээгүй</div>
            ) : (
              animals.map((a) => (
                <div
                  key={a.animalType ?? ""}
                  className="flex justify-between gap-2 tabular-nums"
                >
                  <span className="font-medium">{a.animalType}</span>
                  <span className="text-muted-foreground">
                    {a.count} толгой · {formatNumber(a.weightKg)} кг
                  </span>
                </div>
              ))
            )}
            {Number(s?.unpaidAmount ?? 0) > 0 ? (
              <div className="mt-3 rounded-md bg-amber-50 px-2 py-1 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                Үлдэгдэл олгох: {formatMNT(s?.unpaidAmount)}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Данс</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Банк</div>
            <div>{h.bankName ?? "—"}</div>
            <div className="text-muted-foreground">Дансны дугаар</div>
            <div className="font-mono">{h.bankAccount ?? "—"}</div>
            <div className="text-muted-foreground">Эзэмшигч</div>
            <div>{h.accountHolderName ?? h.name}</div>
            <div className="text-muted-foreground">Бүртгүүлсэн</div>
            <div>{fmtDate(h.createdAt)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <div className="text-lg font-semibold">Бүртгэлүүд</div>
        {regs.length === 0 ? (
          <EmptyState>Бүртгэл алга</EmptyState>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Үйлдвэр</TableHead>
                  <TableHead>Мал</TableHead>
                  <TableHead>Төлөв</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regs.map((r) => (
                  <TableRow key={r.id!}>
                    <TableCell>
                      <Link
                        href={`/registrations/${r.id}`}
                        className="font-mono text-sm hover:underline"
                      >
                        {r.registrationCode}
                      </Link>
                    </TableCell>
                    <TableCell>{fmtDate(r.intakeDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {factoryName(factories, r.factory)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {compact(r.animalLines)
                        .map((l) =>
                          l.count ? `${l.animalType} ${l.count}` : l.animalType,
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <LinkPaginationFooter
          page={page}
          total={count}
          prevHref={page > 1 ? `/herders/${id}?page=${page - 1}` : null}
          nextHref={
            page * PAGE_SIZE < count ? `/herders/${id}?page=${page + 1}` : null
          }
        />
      </div>
    </div>
  );
}
