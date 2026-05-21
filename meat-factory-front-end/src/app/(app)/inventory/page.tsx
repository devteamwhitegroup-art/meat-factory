import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getClient } from '@/lib/apollo/server';
import { InventoryStockDoc } from '@/lib/queries/inventory';
import { compact } from '@/lib/compact';
import { ANIMAL_MN, BYPRODUCT_MN, PRODUCT_TYPE_MN } from '@/lib/format/enum';
import { formatNumber } from '@/lib/format/money';

export default async function InventoryPage() {
  const { data } = await getClient().query({
    query: InventoryStockDoc,
    variables: { productType: null, animalType: null, byproductType: null },
  });
  const items = compact(data?.inventoryStock?.inventoryItems);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Нөөц</h1>
        <div className="flex gap-2">
          <Link
            href="/inventory/movements"
            className={buttonVariants({ variant: 'outline' })}
          >
            Хөдөлгөөн
          </Link>
          <Link href="/inventory/adjust" className={buttonVariants()}>
            Тохируулга
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Нөөц байхгүй
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Бүтээгдэхүүн</TableHead>
                <TableHead className="text-right">Үлдэгдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => {
                const product =
                  i.productType === 'MEAT'
                    ? ANIMAL_MN[i.animalType ?? ''] ?? i.animalType
                    : BYPRODUCT_MN[i.byproductType ?? ''] ?? i.byproductType;
                return (
                  <TableRow key={i.id!}>
                    <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                    <TableCell>
                      {PRODUCT_TYPE_MN[i.productType ?? ''] ?? i.productType}
                    </TableCell>
                    <TableCell>{product}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(i.quantityKg)} кг
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
