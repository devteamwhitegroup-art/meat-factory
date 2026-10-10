import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClient } from "@/lib/apollo/server";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { InventoryMovementsDoc } from "@/lib/queries/inventory";
import { unwrapList } from "@/lib/unwrap";
import {
  FACTORY_MN,
  MOVEMENT_SOURCE_MN,
  MOVEMENT_TYPE_MN,
} from "@/lib/format/enum";
import { FactoryFilter } from "@/components/common/FactoryFilter";
import { isCrossFactoryRole } from "@/lib/auth/roles";
import { formatNumber } from "@/lib/format/money";
import { fmtDateTime } from "@/lib/format/date";

import { requireCap } from "@/lib/auth/server";

type Props = { searchParams: Promise<{ factory?: string }> };

// A movement moves kg (meat / weighed organs) and/or pieces (counted гэдэс).
// Show the units this movement actually touched.
function units(
  kg: unknown,
  count: unknown,
  moved: { kg: number; count: number },
) {
  return [
    moved.count > 0 ? `${Number(count ?? 0)} ш` : null,
    moved.kg > 0 || moved.count <= 0
      ? `${formatNumber(Number(kg ?? 0))} кг`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function InventoryMovementsPage({ searchParams }: Props) {
  const role = await requireCap("inventory");
  const crossFactory = isCrossFactoryRole(role);
  const sp = await searchParams;
  const factory =
    sp.factory && sp.factory in FACTORY_MN ? (sp.factory as never) : null;
  const { data } = await getClient().query({
    query: InventoryMovementsDoc,
    variables: {
      factory,
      inventoryItemId: null,
      movementType: null,
      source: null,
      dateRange: null,
      limit: 50,
      page: 1,
    },
  });
  const { rows, error } = unwrapList(
    data?.inventoryMovements,
    data?.inventoryMovements?.movements,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Нөөц</h1>
      <InventoryTabs />
      {crossFactory ? <FactoryFilter /> : null}
      <div className="text-sm text-muted-foreground">
        Нөөц рүү орсон / гарсан бүх хөдөлгөөний түүх.
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
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
                {crossFactory ? <TableHead>Үйлдвэр</TableHead> : null}
                <TableHead>SKU</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Эх үүсвэр</TableHead>
                <TableHead className="text-right">Хэмжээ</TableHead>
                <TableHead className="text-right">Үлдэгдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => {
                const moved = {
                  kg: Number(m.quantityKg ?? 0),
                  count: Number(m.quantityCount ?? 0),
                };
                return (
                  <TableRow key={m.id!}>
                    <TableCell>{fmtDateTime(m.createdAt)}</TableCell>
                    {crossFactory ? (
                      <TableCell>
                        {FACTORY_MN[m.item?.factory ?? ""] ?? "—"}
                      </TableCell>
                    ) : null}
                    <TableCell className="font-mono text-xs">
                      {m.item?.sku ?? "—"}
                    </TableCell>
                    <TableCell>
                      {MOVEMENT_TYPE_MN[m.movementType ?? ""] ?? m.movementType}
                    </TableCell>
                    <TableCell>
                      {MOVEMENT_SOURCE_MN[m.source ?? ""] ?? m.source}
                    </TableCell>
                    <TableCell className="text-right">
                      {units(m.quantityKg, m.quantityCount, moved)}
                    </TableCell>
                    <TableCell className="text-right">
                      {units(m.balanceAfterKg, m.balanceAfterCount, moved)}
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
