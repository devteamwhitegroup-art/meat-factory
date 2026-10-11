import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { getClient } from "@/lib/apollo/server";
import { requireCap } from "@/lib/auth/server";
import { pageAndRange } from "@/lib/date/range";
import { compact } from "@/lib/compact";
import { formatNumber } from "@/lib/format/money";
import { fmtDateTime } from "@/lib/format/date";
import { unwrapList } from "@/lib/unwrap";
import { ByproductProcessingsDoc } from "@/lib/queries/byproduct-processing";
import { Diff } from "./_components/Diff";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SP = { page?: string; from?: string; to?: string };

// Byproduct factory (Үйлдвэр 3): disassembly batches of counted гэдэс, each
// organ weighed — norm-expected vs actual kg. Totals: /byproduct/analytics.
export default async function ByproductPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireCap("BYPRODUCT_PROCESS");
  const sp = await searchParams;
  const { page, dateRange } = pageAndRange(sp);
  const listRes = await getClient().query({
    query: ByproductProcessingsDoc,
    variables: {
      factory: null,
      wrapperId: null,
      dateRange,
      limit: PAGE_SIZE,
      page,
    },
  });
  const { rows, count, error } = unwrapList(
    listRes.data?.byproductProcessings,
    listRes.data?.byproductProcessings?.processings,
  );

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (sp.from) q.set("from", sp.from);
    if (sp.to) q.set("to", sp.to);
    q.set("page", String(p));
    return `/byproduct?${q}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DateRangeFilter />
        <Link href="/byproduct/new" className={buttonVariants()}>
          Шинэ задлалт
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
            Задлалт алга
          </div>
        ) : (
          rows.map((p) => (
            <Card key={p.id!}>
              <CardHeader className="flex flex-row flex-wrap items-baseline justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="font-mono text-base">
                    {p.code}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {p.wrapper?.animalType} · {p.wrapper?.name} —{" "}
                    {p.bundleCount} ш
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {fmtDateTime(p.createdAt)}
                  <div>{p.createdBy?.param ?? "—"}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Эрхтэн</TableHead>
                      <TableHead className="text-right">Тоо</TableHead>
                      <TableHead className="text-right">Хүлээгдсэн</TableHead>
                      <TableHead className="text-right">Бодит</TableHead>
                      <TableHead className="text-right">Зөрүү</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compact(p.lines).map((l) => (
                      <TableRow key={l.id!}>
                        <TableCell>{l.name}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {l.expectedCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {l.expectedKg != null
                            ? `${formatNumber(l.expectedKg)} кг`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(l.actualKg)} кг
                        </TableCell>
                        <TableCell className="text-right">
                          <Diff
                            expected={l.expectedKg}
                            actual={l.actualKg ?? 0}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {p.notes ? (
                  <div className="text-xs text-muted-foreground">{p.notes}</div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Нийт: {count}</span>
          <div className="space-x-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                ←
              </Link>
            ) : null}
            <span>Хуудас {page}</span>
            {rows.length >= PAGE_SIZE ? (
              <Link
                href={pageHref(page + 1)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
