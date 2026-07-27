import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClient } from "@/lib/apollo/server";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { StockSplit } from "@/components/inventory/StockSplit";
import { BreakdownPie } from "@/components/dashboard/BreakdownPie";
import { InventoryStatsDoc, InventoryStockDoc } from "@/lib/queries/inventory";
import { ByproductWrapperListDoc } from "@/lib/queries/byproduct-wrapper";
import { unwrapList } from "@/lib/unwrap";
import { compact } from "@/lib/compact";
import { formatNumber } from "@/lib/format/money";
import { PRODUCT_TYPE_MN } from "@/lib/format/enum";

import { requireCap } from "@/lib/auth/server";

// Human-readable SKU built FE-side (the BE sku doesn't carry the byproduct path).
//   Meat       →  Мах:<animal>                    e.g. Мах:Үхэр
//   Byproduct  →  Дайвар:<animal>:<wrapper>:<name> e.g. Дайвар:Адуу:Гэдэс:Зүрх
// The inventory row has no wrapper, so it's resolved from the byproduct
// catalogue by (animal, constant name).
// ponytail: if one constant name lives under >1 wrapper for the same animal the
// map keeps the last (cosmetic only); add wrapperName to InventoryItem if it bites.
function buildSku(
  item: {
    productType?: string | null;
    animal?: { name?: string | null } | null;
    byproductName?: string | null;
  },
  wrapperByKey: Record<string, string>,
): string {
  const animal = item.animal?.name ?? "";
  if (item.productType === "MEAT") {
    return animal ? `${PRODUCT_TYPE_MN.MEAT}:${animal}` : PRODUCT_TYPE_MN.MEAT;
  }
  const wrapper = wrapperByKey[`${animal}::${item.byproductName ?? ""}`];
  return [PRODUCT_TYPE_MN.BYPRODUCT, animal, wrapper, item.byproductName]
    .filter(Boolean)
    .join(":");
}

export default async function InventoryPage() {
  await requireCap("inventory");
  const client = getClient();
  const [stockResp, statsResp, wrapResp] = await Promise.all([
    client.query({
      query: InventoryStockDoc,
      variables: { productType: null, animalId: null, byproductName: null },
    }),
    client.query({ query: InventoryStatsDoc }),
    client.query({
      query: ByproductWrapperListDoc,
      variables: { animalType: null, isActive: null },
    }),
  ]);
  // (animal, constant name) → wrapper name, for the byproduct SKU path.
  const wrapperByKey: Record<string, string> = {};
  for (const w of compact(
    wrapResp.data?.byproductWrappers?.byproductWrappers,
  )) {
    for (const it of compact(w.items)) {
      if (w.animalType && w.name && it.name)
        wrapperByKey[`${w.animalType}::${it.name}`] = w.name;
    }
  }
  const { rows: items, error: stockError } = unwrapList(
    stockResp.data?.inventoryStock,
    stockResp.data?.inventoryStock?.inventoryItems,
  );
  const stats = statsResp.data?.inventoryStats?.stats;

  const meatStock = Number(stats?.meatStockKg ?? 0);
  const meatCap = Number(stats?.meatCapacityKg ?? 0);
  const pct =
    meatCap > 0 ? Math.min(100, Math.round((meatStock / meatCap) * 100)) : 0;

  // One InventoryItem row per animal type on the MEAT side (SKU is
  // Мах:<animal>), so no aggregation needed — just map straight to slices.
  const meatByAnimal = items
    .filter((i) => i.productType === "MEAT")
    .map((i) => ({
      name: i.animal?.name ?? "—",
      value: Number(i.quantityKg ?? 0),
    }));

  const exportEligible = Number(stats?.exportEligibleMeatKg ?? 0);
  const domesticAvailable = Number(stats?.domesticAvailableMeatKg ?? 0);
  const exportThreshold = Number(stats?.exportAlertThresholdKg ?? 0);
  const domesticThreshold = Number(stats?.domesticAlertThresholdKg ?? 0);
  const exportAlert = !!stats?.exportAlertActive;
  const domesticAlert = !!stats?.domesticAlertActive;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Нөөц</h1>
        <div>
          <Link href="/shipments/export/new" className={buttonVariants()}>
            Экспортын шинэ ачилт
          </Link>
          <Link href="/shipments/domestic/new" className={buttonVariants()}>
            Дотоодын шинэ ачилт
          </Link>
        </div>
      </div>

      <InventoryTabs />

      {/* ─── Analytics tiles ──────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Махны нөөц</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="text-3xl font-semibold tabular-nums">
                {formatNumber(meatStock)} кг
              </div>
              <div className="text-xs text-muted-foreground">
                Багтаамж:{" "}
                <span className="font-medium">
                  {meatCap > 0
                    ? `${formatNumber(meatCap)} кг`
                    : "— тохируулаагүй"}
                </span>
              </div>
            </div>
            {/* Capacity bar. */}
            {meatCap > 0 ? (
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    "h-full " + (pct >= 80 ? "bg-amber-400" : "bg-emerald-500")
                  }
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Багтаамж тохируулаагүй —{" "}
                <Link href="/settings" className="underline">
                  Систем тохиргоо
                </Link>{" "}
                руу орно уу.
              </div>
            )}
          </CardContent>
        </Card>

        <BreakdownPie
          title="Малын задаргаа"
          data={meatByAnimal}
          emptyText="Махны нөөц алга"
        />
      </div>

      {/* ─── Экспорт / дотоод: экспортын ачилтад зөвхөн экспортын
          зөвшөөрөлтэй малын мах (Animal.isExport) ачигдана, харин дотоод
          ачилтад ямар ч мах ачих боломжтой тул "Дотоодод ачих боломжтой" нь
          нийт махны нөөцтэй тэнцүү (экспортын хэсгийг багтаасан). Босго
          давсан үед админ шинэ ачилт дуудна. ─────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">
              Экспортод ачих боломжтой
            </CardTitle>
            {exportAlert ? (
              <Badge className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Босго давсан
              </Badge>
            ) : exportThreshold > 0 ? (
              <Badge className="border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                Хэвийн
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold tabular-nums">
              {formatNumber(exportEligible)} кг
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Дотоодод ачих боломжтой</CardTitle>
            {domesticAlert ? (
              <Badge className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Босго давсан
              </Badge>
            ) : domesticThreshold > 0 ? (
              <Badge className="border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                Хэвийн
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold tabular-nums">
              {formatNumber(domesticAvailable)} кг
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Stock split: Мах vs Дайвар ──────────────────────────── */}
      {stockError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {stockError}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Нөөц байхгүй
        </div>
      ) : (
        <StockSplit
          items={items.map((i) => ({
            id: i.id!,
            sku: buildSku(i, wrapperByKey),
            productType: (i.productType ?? "MEAT") as "MEAT" | "BYPRODUCT",
            animalType: i.animal?.name ?? null,
            byproductName: i.byproductName ?? null,
            quantityKg: Number(i.quantityKg ?? 0),
          }))}
        />
      )}
    </div>
  );
}
