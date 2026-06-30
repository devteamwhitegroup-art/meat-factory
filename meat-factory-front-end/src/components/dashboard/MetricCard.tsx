import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: string;
  hint?: string;
  accent?: "green" | "amber" | "rose" | "default";
};

const ACCENT: Record<NonNullable<Props["accent"]>, string> = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  rose: "text-rose-700",
  default: "text-foreground",
};

export function MetricCard({ label, value, hint, accent = "default" }: Props) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`text-3xl font-bold ${ACCENT[accent]}`}>{value}</div>
        {hint ? (
          <div className="text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
