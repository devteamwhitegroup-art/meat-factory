import Link from "next/link";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
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
import {
  SHIPMENT_STATUS_MN,
  DOMESTIC_MARKET_MN,
} from "@/lib/format/enum";
import { getFactories } from "@/lib/factory/server";
import { factoryName } from "@/lib/factory/factories";
import { FactoryFilter } from "@/components/common/FactoryFilter";
import { formatNumber, formatMNT } from "@/lib/format/money";
import { fmtDate } from "@/lib/format/date";
import { pageAndRange } from "@/lib/date/range";
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

const CATEGORY_TAB: Record<"EXPORT" | "DOMESTIC", string> = {
  EXPORT: "Экспорт",
  DOMESTIC: "Дотоод",
};
const NEW_LABEL: Record<"EXPORT" | "DOMESTIC", string> = {
  EXPORT: "Шинэ экспортын ачилт",
  DOMESTIC: "Шинэ дотоод ачилт",
};

export type ShipmentCategory = "EXPORT" | "DOMESTIC";

export type ShipmentListSearchParams = {
  // export | domestic
  tab?: string;
  factory?: string;
  status?: string;
  market?: string;
  page?: string;
  from?: string;
  to?: string;
};

// The single /shipments list; `?tab=export|domestic` picks the category.
// Domestic adds a LOCAL/ULAANBAATAR market sub-filter + badge column.
export async function ShipmentListView({
  category,
  categories,
  searchParams: sp,
  crossFactory,
  canCreate,
}: {
  category: ShipmentCategory;
  // Tabs offered (Үйлдвэр 3 ships domestic only).
  categories: ShipmentCategory[];
  searchParams: ShipmentListSearchParams;
  // Owner/admin: factory filter + column. Staff are BE-scoped to their own.
  crossFactory: boolean;
  // нягтлан only views.
  canCreate: boolean;
}) {
  const isDomestic = category === "DOMESTIC";
  const factories = await getFactories();
  const factory = factories.some((f) => f.code === sp.factory)
    ? (sp.factory as string)
    : null;
  const base = "/shipments";

  const status =
    sp.status && STATUS_TABS.some((t) => t.value === sp.status)
      ? sp.status
      : null;
  const market =
    isDomestic && sp.market && MARKET_TABS.some((t) => t.value === sp.market)
      ? sp.market
      : null;
  const { page, dateRange } = pageAndRange(sp);

  // Preserve all active filters in a generated href, overriding one key.
  const hrefWith = (overrides: { status?: string; market?: string }) => {
    const params = new URLSearchParams({ tab: category.toLowerCase() });
    const st = overrides.status ?? status ?? "";
    const mk = overrides.market ?? market ?? "";
    if (st) params.set("status", st);
    if (isDomestic && mk) params.set("market", mk);
    if (factory) params.set("factory", factory);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    return `${base}?${params}`;
  };
  // Switching category keeps status / factory / dates, drops the market.
  const tabHref = (c: ShipmentCategory) => {
    const params = new URLSearchParams({ tab: c.toLowerCase() });
    if (status) params.set("status", status);
    if (factory) params.set("factory", factory);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    return `${base}?${params}`;
  };

  const { data } = await getClient().query({
    query: ShipmentListDoc,
    variables: {
      factory,
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
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-semibold">Ачилт</h1>
          {categories.length > 1 ? (
            <div className={SEGMENTED}>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={tabHref(c)}
                  className={segmentCls(c === category)}
                >
                  {CATEGORY_TAB[c]}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter />
          {canCreate ? (
            <Link
              href={`/shipments/${category.toLowerCase()}/new`}
              className={buttonVariants()}
            >
              {NEW_LABEL[category]}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {crossFactory ? <FactoryFilter /> : null}
        {/* Domestic-only LOCAL / ULAANBAATAR sub-filter. */}
        {isDomestic ? (
          <div className={SEGMENTED}>
            {MARKET_TABS.map((t) => (
              <Link
                key={t.value}
                href={hrefWith({ market: t.value })}
                className={segmentCls((market ?? "") === t.value)}
              >
                {t.label}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Status filter. */}
        <div className={SEGMENTED}>
          {STATUS_TABS.map((t) => (
            <Link
              key={t.value}
              href={hrefWith({ status: t.value })}
              className={segmentCls((status ?? "") === t.value)}
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
                {crossFactory ? <TableHead>Үйлдвэр</TableHead> : null}
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
                  {crossFactory ? (
                    <TableCell>
                      <Badge variant="outline">
                        {factoryName(factories, s.factory)}
                      </Badge>
                    </TableCell>
                  ) : null}
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
