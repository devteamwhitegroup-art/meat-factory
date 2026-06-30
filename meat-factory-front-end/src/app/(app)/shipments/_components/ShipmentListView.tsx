import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClient } from "@/lib/apollo/server";
import { ShipmentListDoc } from "@/lib/queries/shipment";
import { unwrapList } from "@/lib/unwrap";
import { SHIPMENT_STATUS_MN, DOMESTIC_MARKET_MN } from "@/lib/format/enum";
import { formatNumber, formatMNT } from "@/lib/format/money";
import { fmtDate } from "@/lib/format/date";
import { parseRange, thisMonth } from "@/lib/date/range";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";

const STATUS_TABS = [
  { value: "", label: "Бүгд" },
  { value: "PENDING", label: "Хүлээгдэж буй" },
  { value: "LOADED", label: "Ачигдсан" },
  { value: "DELIVERED", label: "Хүргэгдсэн" },
];

const MARKET_TABS = [
  { value: "", label: "Бүгд" },
  { value: "ULAANBAATAR", label: "Улаанбаатар" },
  { value: "LOCAL", label: "Орон нутаг" },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "border-0 bg-slate-200 text-slate-800",
  LOADED: "border-0 bg-amber-100 text-amber-800",
  DELIVERED: "border-0 bg-emerald-100 text-emerald-800",
};

const MARKET_COLOR: Record<string, string> = {
  ULAANBAATAR: "border-0 bg-sky-100 text-sky-800",
  LOCAL: "border-0 bg-violet-100 text-violet-800",
};

const PAGE_TITLE: Record<"EXPORT" | "DOMESTIC", string> = {
  EXPORT: "Экспортын ачилт",
  DOMESTIC: "Дотоод ачилт",
};

// shadcn-style tab look, recreated with <Link>s (this is a server component, so
// the interactive <Tabs> primitive can't be used).
const TAB_LIST =
  "inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1";
function tabCls(active: boolean) {
  return (
    "inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all " +
    (active
      ? "bg-background text-foreground shadow-sm"
      : "text-foreground/60 hover:text-foreground")
  );
}

export type ShipmentCategory = "EXPORT" | "DOMESTIC";

export type ShipmentListSearchParams = {
  status?: string;
  market?: string;
  page?: string;
  from?: string;
  to?: string;
};

// Shared list body for both /shipments/export and /shipments/domestic. The
// only axes that differ: the fixed `category` and (domestic only) a
// LOCAL/ULAANBAATAR market sub-filter + badge column.
export async function ShipmentListView({
  category,
  searchParams: sp,
}: {
  category: ShipmentCategory;
  searchParams: ShipmentListSearchParams;
}) {
  const isDomestic = category === "DOMESTIC";
  const base = `/shipments/${category.toLowerCase()}`;

  const status =
    sp.status && STATUS_TABS.some((t) => t.value === sp.status)
      ? sp.status
      : null;
  const market =
    isDomestic && sp.market && MARKET_TABS.some((t) => t.value === sp.market)
      ? sp.market
      : null;
  const page = Number(sp.page) || 1;
  const def = thisMonth();
  const dateRange = parseRange(sp.from ?? def.from, sp.to ?? def.to);

  // Preserve all active filters in a generated href, overriding one key.
  const hrefWith = (overrides: { status?: string; market?: string }) => {
    const params = new URLSearchParams();
    const st = overrides.status ?? status ?? "";
    const mk = overrides.market ?? market ?? "";
    if (st) params.set("status", st);
    if (isDomestic && mk) params.set("market", mk);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const { data } = await getClient().query({
    query: ShipmentListDoc,
    variables: {
      category,
      domesticMarket: market as never,
      status: status as never,
      dateRange,
      limit: 20,
      page,
    },
  });
  const { rows, count, error } = unwrapList(
    data?.shipments,
    data?.shipments?.shipments,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{PAGE_TITLE[category]}</h1>
        <div className="flex items-center gap-2">
          <DateRangeFilter />
          <Link href={`${base}/new`} className={buttonVariants()}>
            Шинэ ачилт
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Domestic-only LOCAL / ULAANBAATAR sub-filter. */}
        {isDomestic ? (
          <div className={TAB_LIST}>
            {MARKET_TABS.map((t) => (
              <Link
                key={t.value}
                href={hrefWith({ market: t.value })}
                className={tabCls((market ?? "") === t.value)}
              >
                {t.label}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Status filter. */}
        <div className={TAB_LIST}>
          {STATUS_TABS.map((t) => (
            <Link
              key={t.value}
              href={hrefWith({ status: t.value })}
              className={tabCls((status ?? "") === t.value)}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

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
                {isDomestic ? <TableHead>Зах зээл</TableHead> : null}
                <TableHead>Жин</TableHead>
                <TableHead className="text-right">Нийт үнэ</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id!}>
                  <TableCell className="font-medium">
                    {s.customer?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {s.shipmentCode}
                  </TableCell>
                  {isDomestic ? (
                    <TableCell>
                      {s.domesticMarket ? (
                        <Badge
                          className={
                            MARKET_COLOR[s.domesticMarket] ??
                            "border-0 bg-muted"
                          }
                        >
                          {DOMESTIC_MARKET_MN[s.domesticMarket] ??
                            s.domesticMarket}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell>{formatNumber(s.weightKg)} кг</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.totalPrice != null ? formatMNT(s.totalPrice) : "—"}
                  </TableCell>
                  <TableCell>{fmtDate(s.shippedAt ?? s.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        STATUS_COLOR[s.status ?? ""] ?? "border-0 bg-muted"
                      }
                    >
                      {SHIPMENT_STATUS_MN[s.status ?? ""] ?? s.status}
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
