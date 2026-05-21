'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ANIMAL_MN, ANIMAL_TYPES } from '@/lib/format/enum';

export type AnimalCounts = Record<string, number>;

type Props = {
  value: AnimalCounts;
  onChange: (next: AnimalCounts) => void;
};

export function AnimalCountGrid({ value, onChange }: Props) {
  function set(type: string, n: number) {
    onChange({ ...value, [type]: Math.max(0, Math.floor(n)) });
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ANIMAL_TYPES.map((t) => (
        <Card key={t}>
          <CardContent className="flex flex-col items-center gap-2 p-3">
            <div className="text-sm font-medium">{ANIMAL_MN[t]}</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set(t, (value[t] ?? 0) - 1)}
              >
                −
              </Button>
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                value={value[t] ?? 0}
                onChange={(e) => set(t, Number(e.target.value) || 0)}
                className="h-9 w-16 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set(t, (value[t] ?? 0) + 1)}
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
