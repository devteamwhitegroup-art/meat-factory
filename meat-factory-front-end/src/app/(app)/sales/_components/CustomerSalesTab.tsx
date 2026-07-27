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
import { SalesListDoc } from "@/lib/queries/sales";
import { compact } from "@/lib/compact";
import { PAYMENT_STATUS_MN } from "@/lib/format/enum";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { fmtDate } from "@/lib/format/date";
import { pageAndRange } from "@/lib/date/range";

const TABS = [
  { value: "", label: "Бүгд" },
  { value: "PAID", label: "Төлбөр хийсэн" },
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
                className={
                  "rounded-full border px-3 py-1 text-xs transition-colors " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted")
                }
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

      {errorMsg ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMsg}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Гүйлгээ олдсонгүй
        </div>
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
                          ? "border-0 bg-emerald-100 text-emerald-800"
                          : "border-0 bg-amber-100 text-amber-800"
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
