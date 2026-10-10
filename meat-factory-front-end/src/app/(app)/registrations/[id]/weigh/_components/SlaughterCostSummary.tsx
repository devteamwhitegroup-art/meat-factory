import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format/money";

type Line = {
  animalType: string;
  count: number;
  slaughterCost: number | null;
};

// Бой зардал is fixed: the per-head price from «Малын тохиргоо» × head count,
// set at intake. Read-only here; the гэдэс price is deducted from it at
// settlement.
export function SlaughterCostSummary({ lines }: { lines: Line[] }) {
  if (lines.length === 0) return null;
  const total = lines.reduce((s, l) => s + (l.slaughterCost ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бой зардал</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {lines.map((l) => (
          <div key={l.animalType} className="flex justify-between gap-3">
            <span>
              {l.animalType} ({l.count})
            </span>
            <span className="tabular-nums">
              {formatNumber(l.slaughterCost ?? 0)}
            </span>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t pt-1 font-medium">
          <span>Нийт</span>
          <span className="tabular-nums">{formatNumber(total)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Нэг толгойн тогтмол үнээр тооцно. Үйлдвэрт үлдэх гэдэсний үнэ бой
          зардлаас хасагдана.
        </p>
      </CardContent>
    </Card>
  );
}
