import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorNotice } from "@/components/common/ListState";
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
import { SalesListDoc } from "@/lib/queries/sales";
import { compact } from "@/lib/compact";
import { PAYMENT_STATUS_MN } from "@/lib/format/enum";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { fmtDate } from "@/lib/format/date";
import { pageAndRange } from "@/lib/date/range";
import { chipCls } from "@/components/ui/segmented";

const TABS = [
  { value: "", label: "Бүгд" },
  { value: "PAID", label: "Төлбөр хийсэн" },
  { value: "PARTIALLY_PAID", label: "Хэсэгчлэн төлсөн" },
  { value: "PENDING", label: "Хүлээгдэж буй" },
];

export async function CustomerSalesTab({
  searchParams: sp,
}: {
  searchParams: {
    status?: string;
    page?: string;
    from?: string;
    to?: string;
  };
}) {
  const status =
    sp.status && TABS.some((t) => t.value === sp.status) ? sp.status : null;
  const { page, dateRange } = pageAndRange(sp);
  const tabHref = (statusVal: string) => {
    const params = new URLSearchParams();
    params.set("tab", "customers");
    if (statusVal) params.set("status", statusVal);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    return `/sales?${params.toString()}`;
  };
  const { data } = await getClient().query({
    query: SalesListDoc,
    variables: { paymentStatus: status as never, dateRange, limit: 20, page },
  });

  const rows = compact(data?.salesTransactions?.salesTransactions);
  const count = data?.salesTransactions?.count ?? 0;
  const errorMsg =
    data?.salesTransactions?.success === false
      ? data.salesTransactions.message
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = (status ?? "") === t.value;
            return (
              <Link
                key={t.value}
                href={tabHref(t.value)}
                className={chipCls(active)}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <Link href="/sales/new" className={buttonVariants()}>
          Шинэ гүйлгээ
        </Link>
      </div>

      <ErrorNotice message={errorMsg} />

      {rows.length === 0 ? (
        <EmptyState>Гүйлгээ олдсонгүй</EmptyState>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Харилцагч</TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Жин</TableHead>
                <TableHead>Дүн</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id!}>
                  <TableCell className="font-medium">
                    {r.customer?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.transactionCode}
                  </TableCell>
                  <TableCell>{formatNumber(r.totalWeightKg)} кг</TableCell>
                  <TableCell>{formatMNT(r.amount)}</TableCell>
                  <TableCell>{fmtDate(r.transactionDate)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.paymentStatus === "PAID"
                          ? "border-0 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                          : "border-0 bg-amber-500/12 text-amber-700 dark:text-amber-400"
                      }
                    >
                      {PAYMENT_STATUS_MN[r.paymentStatus ?? ""] ??
                        r.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/sales/${r.id}`}
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
