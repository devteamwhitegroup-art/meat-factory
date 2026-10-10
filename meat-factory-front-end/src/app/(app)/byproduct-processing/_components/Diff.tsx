import { formatNumber } from "@/lib/format/money";

// Actual − expected kg (+ %). Green = more than the norm guessed, red = less.
// `expected` null/undefined = no norm weight, nothing to compare against.
// Plain (non-client) module so both the server list and the client form use it.
export function Diff({
  expected,
  actual,
}: {
  expected: number | null | undefined;
  actual: number;
}) {
  if (expected == null)
    return <span className="text-muted-foreground">—</span>;
  const d = actual - expected;
  const pct = expected > 0 ? (d / expected) * 100 : null;
  const sign = d > 0 ? "+" : "";
  const cls =
    d > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : d < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";
  return (
    <span className={`tabular-nums ${cls}`}>
      {sign}
      {formatNumber(d)} кг
      {pct != null ? ` (${sign}${pct.toFixed(1)}%)` : ""}
    </span>
  );
}
