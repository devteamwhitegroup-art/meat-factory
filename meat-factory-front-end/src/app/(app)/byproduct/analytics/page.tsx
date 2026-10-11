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
import { ByproductProcessingSummaryDoc } from "@/lib/queries/byproduct-processing";
import { Diff } from "../_components/Diff";

export const dynamic = "force-dynamic";

type SP = { from?: string; to?: string };

// Expected (norm) vs actual kg per organ, summed over the period's batches.
export default async function ByproductAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireCap("BYPRODUCT_PROCESS");
  const { dateRange } = pageAndRange(await searchParams);
  const { data } = await getClient().query({
    query: ByproductProcessingSummaryDoc,
    variables: { factory: null, dateRange },
  });
  const summary = compact(data?.byproductProcessingSummary?.items);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangeFilter />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Хүлээгдсэн vs бодит</CardTitle>
          <p className="text-xs text-muted-foreground">
            Хүлээгдсэн = гэдэсний тоо × норм × дундаж жин. Бодит = задалж
            жигнэсэн жин.
          </p>
        </CardHeader>
        <CardContent>
          {summary.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Энэ хугацаанд задлалт алга
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Гэдэс</TableHead>
                  <TableHead>Эрхтэн</TableHead>
                  <TableHead className="text-right">Гэдэс (ш)</TableHead>
                  <TableHead className="text-right">Хүлээгдсэн</TableHead>
                  <TableHead className="text-right">Бодит</TableHead>
                  <TableHead className="text-right">Зөрүү</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((s) => (
                  <TableRow key={`${s.animalType}|${s.wrapperName}|${s.name}`}>
                    <TableCell>
                      {s.animalType} · {s.wrapperName}
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.bundleCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(s.expectedKg)} кг
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(s.actualKg)} кг
                    </TableCell>
                    <TableCell className="text-right">
                      <Diff
                        // 0 expected with no % = norm had no weight.
                        expected={
                          s.diffPercent == null && !s.expectedKg
                            ? null
                            : (s.expectedKg ?? 0)
                        }
                        actual={s.actualKg ?? 0}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
