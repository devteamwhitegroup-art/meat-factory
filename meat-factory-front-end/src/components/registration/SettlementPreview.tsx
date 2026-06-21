"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ANIMAL_MN } from "@/lib/format/enum";
import { formatMNT, formatNumber } from "@/lib/format/money";

export type LineInput = {
  animalType: string;
  slaughterCost: string;
};

type Props = {
  // received[animalType] = Σ weighingEntry.weightKg(type)
  receivedByType: Record<string, number>;
  // meat[animalType] = Σ (weighingEntry.weightKg × weighingEntry.pricePerKg)
  meatByType: Record<string, number>;
  lines: LineInput[];
};

// Meat income is fixed by the per-entry negotiated prices (set at weighing).
// Slaughter cost is fixed by the admin Бой зардал config × counts (with the
// verifier's per-animal cover toggle applied at prefill time) — display-only
// here. Net = Σmeat − Σslaughter.
export function SettlementPreview({
  receivedByType,
  meatByType,
  lines,
}: Props) {
  const totalReceived = Object.values(receivedByType).reduce(
    (a, b) => a + b,
    0,
  );

  const rows = lines.map((l) => {
    const received = receivedByType[l.animalType] ?? 0;
    const meat = meatByType[l.animalType] ?? 0;
    const avgPrice = received > 0 ? meat / received : 0;
    const slaughter = Number(l.slaughterCost) || 0;
    return { ...l, received, meat, avgPrice, slaughter };
  });

  const totalMeat = rows.reduce((sum, r) => sum + r.meat, 0);
  const totalSlaughter = rows.reduce((sum, r) => sum + r.slaughter, 0);
  const net = totalMeat - totalSlaughter;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тооцоо</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="pb-2">Төрөл</th>
              <th className="pb-2">Хүлээн авсан (кг)</th>
              <th className="pb-2">Дундаж үнэ / кг</th>
              <th className="pb-2">Махны дүн</th>
              <th className="pb-2">Бой зардал</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.animalType} className="border-t">
                <td className="py-2">
                  {ANIMAL_MN[r.animalType] ?? r.animalType}
                </td>
                <td className="py-2">{formatNumber(r.received)}</td>
                <td className="py-2">{formatMNT(r.avgPrice)}</td>
                <td className="py-2">{formatMNT(r.meat)}</td>
                <td className="py-2 tabular-nums">{formatMNT(r.slaughter)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Separator />

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-muted-foreground">Нийт хүлээн авсан</div>
          <div className="text-right">{formatNumber(totalReceived)} кг</div>
          <div className="text-muted-foreground">Нийт мах</div>
          <div className="text-right">{formatMNT(totalMeat)}</div>
          <div className="text-muted-foreground">Нийт бой зардал</div>
          <div className="text-right">{formatMNT(totalSlaughter)}</div>
          <div className="text-base font-semibold">Малчинд өгөх дүн</div>
          <div className="text-right text-base font-semibold">
            {formatMNT(net)}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Махны үнэ нь жин бүртгэх үед малчинтай хэлэлцсэн үнээр тогтоогдсон.
        </p>
      </CardContent>
    </Card>
  );
}
