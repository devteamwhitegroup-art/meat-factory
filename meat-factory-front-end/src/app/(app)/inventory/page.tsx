import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getClient } from '@/lib/apollo/server';
import { InventoryTabs } from '@/components/inventory/InventoryTabs';
import { StockSplit } from '@/components/inventory/StockSplit';
import {
  InventoryStatsDoc,
  InventoryStockDoc,
} from '@/lib/queries/inventory';
import { unwrapList } from '@/lib/unwrap';
import { formatNumber } from '@/lib/format/money';

import { requireCap } from '@/lib/auth/server';

export default async function InventoryPage() {
  await requireCap('inventory');
  const client = getClient();
  const [stockResp, statsResp] = await Promise.all([
    client.query({
      query: InventoryStockDoc,
      variables: { productType: null, animalType: null, byproductType: null },
    }),
    client.query({ query: InventoryStatsDoc }),
  ]);
  const { rows: items, error: stockError } = unwrapList(
    stockResp.data?.inventoryStock,
    stockResp.data?.inventoryStock?.inventoryItems,
  );
  const stats = statsResp.data?.inventoryStats?.stats;

  const meatStock = Number(stats?.meatStockKg ?? 0);
  const meatCap = Number(stats?.meatCapacityKg ?? 0);
  const threshold = Number(stats?.meatAlertThresholdKg ?? 0);
  const cargoCap = Number(stats?.cargoCapacityKg ?? 0);
  const alertActive = !!stats?.alertActive;
  const cargosToClear = Number(stats?.cargosToClear ?? 0);
  const pct =
    meatCap > 0 ? Math.min(100, Math.round((meatStock / meatCap) * 100)) : 0;
  const thrPct = meatCap > 0 ? Math.min(100, (threshold / meatCap) * 100) : 0;
  const prefillWeight =
    cargoCap > 0 ? Math.min(cargoCap, Math.max(0, meatStock)) : meatStock;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Нөөц</h1>
        <Link
          href={
            prefillWeight > 0
              ? `/shipments/new?prefillWeightKg=${prefillWeight.toFixed(2)}`
              : '/shipments/new'
          }
          className={buttonVariants()}
        >
          Шинэ ачилт
        </Link>
      </div>

      <InventoryTabs />

      {/* ─── Analytics tiles ──────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Махны нөөц</CardTitle>
            {alertActive ? (
              <Badge className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Босго давсан
              </Badge>
            ) : threshold > 0 ? (
              <Badge className="border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                Хэвийн
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="text-3xl font-semibold tabular-nums">
                {formatNumber(meatStock)} кг
              </div>
              <div className="text-xs text-muted-foreground">
                Багтаамж:{' '}
                <span className="font-medium">
                  {meatCap > 0 ? `${formatNumber(meatCap)} кг` : '— тохируулаагүй'}
                </span>
              </div>
            </div>
            {/* Capacity bar with a threshold tick when configured. */}
            {meatCap > 0 ? (
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    'h-full ' +
                    (alertActive
                      ? 'bg-amber-500'
                      : pct >= 80
                        ? 'bg-amber-400'
                        : 'bg-emerald-500')
                  }
                  style={{ width: `${pct}%` }}
                />
                {threshold > 0 ? (
                  <div
                    className="absolute top-0 h-full w-px bg-foreground/60"
                    style={{ left: `${thrPct}%` }}
                    title={`Босго ${formatNumber(threshold)} кг`}
                  />
                ) : null}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Багтаамж тохируулаагүй —{' '}
                <Link href="/settings" className="underline">
                  Систем тохиргоо
                </Link>{' '}
                руу орно уу.
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                Босго:{' '}
                <span className="font-medium text-foreground">
                  {threshold > 0
                    ? `${formatNumber(threshold)} кг`
                    : 'идэвхгүй'}
                </span>
              </span>
              <span>
                1 ачаа:{' '}
                <span className="font-medium text-foreground">
                  {cargoCap > 0
                    ? `${formatNumber(cargoCap)} кг`
                    : 'тохируулаагүй'}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ачилт санал</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-semibold tabular-nums">
              {cargosToClear || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {cargoCap > 0 && cargosToClear > 0
                ? `Багтаамжийг чөлөөлөхөд ойролцоогоор ${cargosToClear} ачаа явуулна (1 ачаа ≈ ${formatNumber(cargoCap)} кг).`
                : 'Ачааны багтаамж тохируулаагүй эсвэл нөөц багатай.'}
            </div>
            <Link
              href={
                prefillWeight > 0
                  ? `/shipments/new?prefillWeightKg=${prefillWeight.toFixed(2)}`
                  : '/shipments/new'
              }
              className="block"
            >
              <Button className="w-full" disabled={meatStock <= 0}>
                Шинэ ачилт үүсгэх
              </Button>
            </Link>
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
            sku: i.sku ?? '',
            productType: (i.productType ?? 'MEAT') as 'MEAT' | 'BYPRODUCT',
            animalType: i.animalType ?? null,
            byproductType: i.byproductType ?? null,
            byproductName: i.byproductName ?? null,
            quantityKg: Number(i.quantityKg ?? 0),
          }))}
        />
      )}
    </div>
  );
}
