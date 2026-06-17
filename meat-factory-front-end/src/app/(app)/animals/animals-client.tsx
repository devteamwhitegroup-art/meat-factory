'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ANIMAL_MN } from '@/lib/format/enum';
import { useAnimalCatalog } from '@/lib/hooks/useAnimalCatalog';
import { UpsertAnimalDoc } from '@/lib/queries/animal';
import { unwrap } from '@/lib/unwrap';

type Form = { price: string; cover: boolean };

export function AnimalsClient() {
  const { animals, animalTypes, loading, refetch } = useAnimalCatalog();
  const [upsert] = useMutation(UpsertAnimalDoc);
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const existing = animals;

  // Seed forms from server values once they arrive (and on refetch).
  useEffect(() => {
    if (existing.length === 0) return;
    setForms((prev) => {
      const next = { ...prev };
      for (const a of existing) {
        const t = a.animalType as string;
        if (next[t] === undefined) {
          next[t] = {
            price: String(a.pricePerAnimal ?? 0),
            cover: !!a.canCoverSlaughterCost,
          };
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animals]);

  function getForm(t: string): Form {
    return forms[t] ?? { price: '', cover: false };
  }

  async function save(animalType: string) {
    const f = getForm(animalType);
    const n = Number(f.price);
    if (!Number.isFinite(n) || n < 0) {
      toast.error('Үнэ 0-ээс багагүй байх ёстой');
      return;
    }
    setBusy(animalType);
    try {
      const r = await upsert({
        variables: {
          animalType: animalType as never,
          pricePerAnimal: n,
          canCoverSlaughterCost: !!f.cover,
        },
      });
      unwrap(r.data?.upsertAnimal);
      toast.success(`${ANIMAL_MN[animalType] ?? animalType}: хадгаллаа`);
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading && existing.length === 0) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {animalTypes.map((t) => {
        const f = getForm(t);
        return (
          <Card key={t}>
            <CardContent className="space-y-3 p-4">
              <div className="text-base font-semibold">{ANIMAL_MN[t]}</div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Бой зардал — 1 толгойн үнэ (₮)
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={f.price}
                  onChange={(e) =>
                    setForms((s) => ({
                      ...s,
                      [t]: { ...getForm(t), price: e.target.value },
                    }))
                  }
                  placeholder="₮"
                  className="h-11 text-right text-base tabular-nums"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={f.cover}
                  onCheckedChange={(c) =>
                    setForms((s) => ({
                      ...s,
                      [t]: { ...getForm(t), cover: !!c },
                    }))
                  }
                />
                <span>Дайвараар бой зардлыг нөхөх боломжтой</span>
              </label>
              <Button
                type="button"
                onClick={() => save(t)}
                disabled={busy === t}
                className="w-full"
              >
                {busy === t ? '...' : 'Хадгалах'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
