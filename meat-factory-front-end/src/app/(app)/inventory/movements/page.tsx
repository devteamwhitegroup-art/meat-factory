import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getServerUrqlClient } from '@/lib/urql/server';
import { InventoryMovementsDoc } from '@/lib/queries/inventory';
import { compact } from '@/lib/compact';
import {
  MOVEMENT_SOURCE_MN,
  MOVEMENT_TYPE_MN,
} from '@/lib/format/enum';
import { formatNumber } from '@/lib/format/money';
import { fmtDateTime } from '@/lib/format/date';

export default async function InventoryMovementsPage() {
  const client = await getServerUrqlClient();
  const res = await client
    .query(InventoryMovementsDoc, {
      inventoryItemId: null,
      movementType: null,
      source: null,
      dateRange: null,
      limit: 50,
      page: 1,
    })
    .toPromise();
  const rows = compact(res.data?.inventoryMovements?.movements);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Нөөцийн хөдөлгөөн</h1>
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Хөдөлгөөн алга
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Цаг</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Эх үүсвэр</TableHead>
                <TableHead className="text-right">Хэмжээ</TableHead>
                <TableHead className="text-right">Үлдэгдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id!}>
                  <TableCell>{fmtDateTime(m.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.item?.sku ?? '—'}
                  </TableCell>
                  <TableCell>
                    {MOVEMENT_TYPE_MN[m.movementType ?? ''] ?? m.movementType}
                  </TableCell>
                  <TableCell>
                    {MOVEMENT_SOURCE_MN[m.source ?? ''] ?? m.source}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(m.quantityKg)} кг
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(m.balanceAfterKg)} кг
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
