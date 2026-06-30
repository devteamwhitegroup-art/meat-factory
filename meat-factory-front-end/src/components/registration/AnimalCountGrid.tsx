"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";

export type AnimalCounts = Record<string, number>;

type Props = {
  value: AnimalCounts;
  onChange: (next: AnimalCounts) => void;
};

export function AnimalCountGrid({ value, onChange }: Props) {
  const { animalTypes, animalName } = useAnimalCatalog();
  function set(type: string, n: number) {
    onChange({ ...value, [type]: Math.max(0, Math.floor(n)) });
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {animalTypes.map((t) => {
        const count = value[t] ?? 0;
        const active = count > 0;
        return (
          <Card
            key={t}
            className={active ? "border-primary ring-1 ring-primary/30" : ""}
          >
            <CardContent className="flex flex-col items-center gap-3 p-4">
              <div className="text-lg font-semibold">
                {animalName.get(t) ?? t}
              </div>
              <div className="flex w-full items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Хасах"
                  className="size-12 shrink-0 text-2xl"
                  onClick={() => set(t, count - 1)}
                >
                  −
                </Button>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={count}
                  onChange={(e) => set(t, Number(e.target.value) || 0)}
                  className="h-12 w-full min-w-0 text-center text-2xl font-semibold tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Нэмэх"
                  className="size-12 shrink-0 text-2xl"
                  onClick={() => set(t, count + 1)}
                >
                  +
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
