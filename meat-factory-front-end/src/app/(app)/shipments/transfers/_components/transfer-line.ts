import { formatNumber } from "@/lib/format/money";

// "Адуу мах · 120 кг" / "Адуу Элэг · 5 ш · 3 кг" — one transfer line or
// stock row.
export function transferLineText(l: {
  productType?: string | null;
  animal?: { name?: string | null } | null;
  byproductName?: string | null;
  quantityKg?: number | null;
  quantityCount?: number | null;
}): string {
  const name = [
    l.animal?.name,
    l.productType === "MEAT" ? "мах" : l.byproductName,
  ]
    .filter(Boolean)
    .join(" ");
  const qty = [
    Number(l.quantityCount ?? 0) > 0 ? `${l.quantityCount} ш` : null,
    Number(l.quantityKg ?? 0) > 0 ? `${formatNumber(l.quantityKg)} кг` : null,
  ].filter(Boolean);
  return [name, ...qty].join(" · ");
}
