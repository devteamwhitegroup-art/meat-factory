import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WEIGHING_AUDIT_ACTION_MN } from "@/lib/format/enum";
import { formatNumber } from "@/lib/format/money";
import { fmtDateTime } from "@/lib/format/date";

export type AuditRow = {
  id: string;
  action: string | null;
  weightKgBefore: number | null;
  weightKgAfter: number | null;
  pricePerKgBefore: number | null;
  pricePerKgAfter: number | null;
  createdAt: string | null;
  actor: string | null;
};

function arrow(
  before: number | null,
  after: number | null,
  unit: string,
): string | null {
  if (before == null && after == null) return null;
  const b = before != null ? `${formatNumber(before)}${unit}` : "—";
  const a = after != null ? `${formatNumber(after)}${unit}` : "—";
  return `${b} → ${a}`;
}

// Read-only trail of every add/edit/remove on this registration's weighing
// entries — a mistake fixed by a manager after weighing has no other trace
// otherwise (see WeighingEntryAuditModel on the back end).
export function WeighingAuditLog({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Засварын түүх</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((r) => {
          const weight = arrow(r.weightKgBefore, r.weightKgAfter, " кг");
          const price = arrow(r.pricePerKgBefore, r.pricePerKgAfter, "₮");
          return (
            <div key={r.id} className="rounded-md border px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {WEIGHING_AUDIT_ACTION_MN[r.action ?? ""] ?? r.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.actor ?? "—"} · {fmtDateTime(r.createdAt)}
                </span>
              </div>
              {weight || price ? (
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                  {weight ? <span>Жин: {weight}</span> : null}
                  {price ? <span>Үнэ/кг: {price}</span> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
