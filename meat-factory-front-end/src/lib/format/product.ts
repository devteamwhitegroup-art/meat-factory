// Display name of a stock product — same wording as the back-end's
// stockLabel(): "Адуу мах" / "Адуу Зүрх" / "Зүрх".
export function productLabel(
  productType: string | null | undefined,
  animal: string | null | undefined,
  byproductName: string | null | undefined,
): string {
  return productType === "MEAT"
    ? `${animal ?? ""} мах`.trim()
    : [animal, byproductName].filter(Boolean).join(" ");
}
