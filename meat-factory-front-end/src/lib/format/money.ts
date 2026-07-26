const mnt = new Intl.NumberFormat("mn-MN", {
  style: "currency",
  currency: "MNT",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 2 });

export function formatMNT(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "—";
  return mnt.format(v);
}

export function formatNumber(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "—";
  return num.format(v);
}

// Grouped digits, no currency symbol/code — for printed price sheets where
// the column headers already say "₮" and repeating it per cell just wastes
// the narrow roll (and some print paths fall back to the literal "MNT").
export function formatMoney(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "—";
  return mnt.format(v).replace(/₮|MNT/g, "").trim();
}
