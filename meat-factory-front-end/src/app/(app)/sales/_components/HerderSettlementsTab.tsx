import Link from "next/link";
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
import { SettlementsListDoc } from "@/lib/queries/settlement";
import { compact } from "@/lib/compact";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { fmtDate } from "@/lib/format/date";
import { pageAndRange } from "@/lib/date/range";

const TABS = [
  { value: "", label: "Бүгд" },
  { value: "yes", label: "Төлбөр хийсэн" },
  { value: "no", label: "Хүлээгдэж буй" },
];

export async function HerderSettlementsTab({
  searchParams: sp,
}: {
  searchParams: {
    paid?: string;
    page?: string;
    from?: string;
    to?: string;
  };
}) {
  const paid =
    sp.paid && TABS.some((t) => t.value === sp.paid) ? sp.paid : null;
  const { page, dateRange } = pageAndRange(sp);
  const tabHref = (paidVal: string) => {
    const params = new URLSearchParams();
    params.set("tab", "herders");
    if (paidVal) params.set("paid", paidVal);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    return `/sales?${params.toString()}`;
  };
  const { data } = await getClient().query({
    query: SettlementsListDoc,
    variables: {
      isPaid: paid ? paid === "yes" : null,
      dateRange,
      limit: 20,
      page,
    },
  });

  const rows = compact(data?.settlements?.settlements);
  const count = data?.settlements?.count ?? 0;
  const errorMsg =
    data?.settlements?.success === false ? data.settlements.message : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = (paid ?? "") === t.value;
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

      {errorMsg ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMsg}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Тооцоо олдсонгүй
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Малчин</TableHead>
                <TableHead>Бүртгэл</TableHead>
                <TableHead>Нийт төлбөр</TableHead>
                <TableHead>Суутгасан</TableHead>
                <TableHead>Төлсөн</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id!}>
                  <TableCell className="font-medium">
                    {r.registration?.herder?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.registration?.registrationCode ?? "—"}
                  </TableCell>
                  <TableCell>{formatMNT(r.netPayable)}</TableCell>
                  <TableCell>
                    {Number(r.heldAmount ?? 0) > 0
                      ? formatMNT(r.heldAmount)
                      : "—"}
                  </TableCell>
                  <TableCell>{formatMNT(r.paidAmount)}</TableCell>
                  <TableCell>{fmtDate(r.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.isPaid
                          ? "border-0 bg-emerald-100 text-emerald-800"
                          : "border-0 bg-amber-100 text-amber-800"
                      }
                    >
                      {r.isPaid ? "Төлбөр хийсэн" : "Хүлээгдэж буй"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.registrationId ? (
                      <Link
                        href={`/registrations/${r.registrationId}/settlement`}
                        className="text-primary underline"
                      >
                        Дэлгэрэнгүй
                      </Link>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Нийт: {formatNumber(count)}
      </div>
    </div>
  );
}
