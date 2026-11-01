import { formatNumber } from "@/lib/format/money";

// Actual − expected kg (+ %). Green = more than the norm guessed, red = less.
// `diffKg` null = no norm weight, nothing to compare against; `diffPercent`
// null = nothing was expected. Server rows pass the BE's diffKg/diffPercent;
// rows without them (new-batch form, batch lines) use `localDiff`.
// Plain (non-client) module so both the server list and the client form use it.
export function Diff({
  diffKg,
  diffPercent,
}: {
  diffKg: number | null | undefined;
  diffPercent: number | null | undefined;
}) {
  if (diffKg == null) return <span className="text-muted-foreground">—</span>;
  const sign = diffKg > 0 ? "+" : "";
  const cls =
    diffKg > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : diffKg < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";
  return (
    <span className={`tabular-nums ${cls}`}>
      {sign}
      {formatNumber(diffKg)} кг
      {diffPercent != null ? ` (${sign}${diffPercent.toFixed(1)}%)` : ""}
    </span>
  );
}

export function localDiff(
  expected: number | null | undefined,
  actual: number,
): { diffKg: number | null; diffPercent: number | null } {
  if (expected == null) return { diffKg: null, diffPercent: null };
  const d = actual - expected;
  return { diffKg: d, diffPercent: expected > 0 ? (d / expected) * 100 : null };
}
