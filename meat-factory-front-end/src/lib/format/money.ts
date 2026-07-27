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

// ─── Live-grouped decimal input ────────────────────────────────────
//
// For a text <Input> that should show thousand separators while the user
// types a decimal amount (a plain type="number" input can't render commas).
// The component keeps the SANITIZED string in state and only formats it for
// display — parsing (Number(state)) is unaffected.

// Filters raw keystrokes down to a valid decimal-input string: digits and at
// most one ".".
export function sanitizeDecimalInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
}

// Groups the integer part of a sanitized decimal-input string; preserves the
// fractional part (including a trailing "." while still being typed).
export function formatDecimalInput(raw: string): string {
  if (!raw) return "";
  const [intPart, ...rest] = raw.split(".");
  const grouped = intPart ? Number(intPart).toLocaleString("mn-MN") : "";
  return rest.length > 0 ? `${grouped}.${rest.join("")}` : grouped;
}
