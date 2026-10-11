"use client";

import type { ResultOf } from "@graphql-typed-document-node/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShipmentAnalyticsDoc } from "@/lib/queries/shipment";
import { compact } from "@/lib/compact";
import { formatMNT, formatNumber } from "@/lib/format/money";

type Analytics = NonNullable<
  NonNullable<
    ResultOf<typeof ShipmentAnalyticsDoc>["shipmentAnalytics"]
  >["analytics"]
>;

const mnt = (v: number | null | undefined) => (v != null ? formatMNT(v) : "—");

// Admin: meat cost (FIFO from herder purchase prices) vs the salesman's
// reported income, per meat type.
export function ShipmentAnalyticsCard({ a }: { a: Analytics }) {
  const lines = compact(a.lines);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Өртөг ба орлого</CardTitle>
        <p className="text-xs text-muted-foreground">
          Өртөг: малчнаас авсан үнээр, эхэлж орсон мах эхэлж гарна (FIFO).
          Орлого: борлуулалтын тайлангаас.
          {a.costKnown
            ? ""
            : " Өртөг хүргэгдсэний дараа (нөөцөөс хасагдахад) тооцогдоно."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Мах</TableHead>
                <TableHead className="text-right">Ачсан кг</TableHead>
                <TableHead className="text-right">Дундаж өртөг/кг</TableHead>
                <TableHead className="text-right">Нийт өртөг</TableHead>
                <TableHead className="text-right">Зарсан кг</TableHead>
                <TableHead className="text-right">Дундаж орлого/кг</TableHead>
                <TableHead className="text-right">Нийт орлого</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.animalType ?? ""}>
                  <TableCell className="font-medium">{l.animalType}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(l.shippedKg)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {mnt(l.avgCostPerKg)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {mnt(l.cost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(l.soldKg)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {mnt(l.avgIncomePerKg)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {mnt(l.income)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>Нийт</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(a.shippedKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {mnt(a.avgCostPerKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {mnt(a.cost)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(a.soldKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {mnt(a.avgIncomePerKg)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {mnt(a.income)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between rounded-md border-2 border-primary/40 bg-primary/5 px-3 py-2 text-base font-semibold">
          <span>Ашиг (орлого − өртөг)</span>
          <span
            className={
              "tabular-nums " +
              (a.profit != null && a.profit < 0 ? "text-destructive" : "")
            }
          >
            {mnt(a.profit)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
