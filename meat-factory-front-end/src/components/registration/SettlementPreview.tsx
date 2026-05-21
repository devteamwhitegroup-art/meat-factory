'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ANIMAL_MN } from '@/lib/format/enum';
import { formatMNT, formatNumber } from '@/lib/format/money';

export type LineInput = {
  animalType: string;
  pricePerKg: string;
  slaughterCost: string;
  byproductPricePerKg: string;
};

type Props = {
  // received[animalType] = Σ weighingEntry.weightKg(type)
  receivedByType: Record<string, number>;
  byproductTotalWeight: number;
  lines: LineInput[];
  onChange: (lines: LineInput[]) => void;
};

// Mirrors back-end registration.controller.ts → createSettlement exactly.
export function SettlementPreview({
  receivedByType,
  byproductTotalWeight,
  lines,
  onChange,
}: Props) {
  const totalReceived = Object.values(receivedByType).reduce(
    (a, b) => a + b,
    0,
  );

  let totalMeat = 0;
  let totalByproduct = 0;
  let totalSlaughter = 0;

  const rows = lines.map((l) => {
    const received = receivedByType[l.animalType] ?? 0;
    const price = Number(l.pricePerKg) || 0;
    const slaughter = Number(l.slaughterCost) || 0;
    const byprodPrice = Number(l.byproductPricePerKg) || 0;
    const alloc =
      totalReceived > 0
        ? byproductTotalWeight * (received / totalReceived)
        : 0;
    const meat = received * price;
    const byprod = alloc * byprodPrice;
    totalMeat += meat;
    totalByproduct += byprod;
    totalSlaughter += slaughter;
    return { ...l, received, price, slaughter, byprodPrice, alloc, meat, byprod };
  });

  const gross = totalMeat + totalByproduct;
  const net = gross - totalSlaughter;

  function set(animalType: string, field: keyof LineInput, value: string) {
    onChange(
      lines.map((l) =>
        l.animalType === animalType ? { ...l, [field]: value } : l,
      ),
    );
  }

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
              <th className="pb-2">Үнэ / кг</th>
              <th className="pb-2">Дайвар үнэ / кг</th>
              <th className="pb-2">Бой зардал</th>
              <th className="pb-2">Махны дүн</th>
              <th className="pb-2">Дайварын дүн</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.animalType} className="border-t">
                <td className="py-2">{ANIMAL_MN[r.animalType] ?? r.animalType}</td>
                <td className="py-2">{formatNumber(r.received)}</td>
                <td className="py-2">
                  <Input
                    inputMode="decimal"
                    value={r.pricePerKg}
                    onChange={(e) => set(r.animalType, 'pricePerKg', e.target.value)}
                    className="h-8 w-28"
                  />
                </td>
                <td className="py-2">
                  <Input
                    inputMode="decimal"
                    value={r.byproductPricePerKg}
                    onChange={(e) =>
                      set(r.animalType, 'byproductPricePerKg', e.target.value)
                    }
                    className="h-8 w-28"
                  />
                </td>
                <td className="py-2">
                  <Input
                    inputMode="decimal"
                    value={r.slaughterCost}
                    onChange={(e) => set(r.animalType, 'slaughterCost', e.target.value)}
                    className="h-8 w-28"
                  />
                </td>
                <td className="py-2">{formatMNT(r.meat)}</td>
                <td className="py-2">{formatMNT(r.byprod)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Separator />

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-muted-foreground">Нийт хүлээн авсан</div>
          <div className="text-right">{formatNumber(totalReceived)} кг</div>
          <div className="text-muted-foreground">Дайвар нийт жин</div>
          <div className="text-right">{formatNumber(byproductTotalWeight)} кг</div>
          <div className="text-muted-foreground">Нийт мах</div>
          <div className="text-right">{formatMNT(totalMeat)}</div>
          <div className="text-muted-foreground">Нийт дайвар</div>
          <div className="text-right">{formatMNT(totalByproduct)}</div>
          <div className="text-muted-foreground">Нийт бой зардал</div>
          <div className="text-right">{formatMNT(totalSlaughter)}</div>
          <div className="font-medium">Нийт төлбөр</div>
          <div className="text-right font-medium">{formatMNT(gross)}</div>
          <div className="text-base font-semibold">Цэвэр төлбөр</div>
          <div className="text-right text-base font-semibold">
            {formatMNT(net)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
