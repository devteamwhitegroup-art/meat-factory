"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { UpsertAnimalDoc } from "@/lib/queries/animal";
import { runMutation } from "@/lib/runMutation";

type Form = { name: string; price: string; cover: boolean };

export function AnimalsClient() {
  const { animals, animalTypes, animalName, loading, refetch } =
    useAnimalCatalog();
  const [upsert] = useMutation(UpsertAnimalDoc);
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const existing = animals;

  // `forms` holds only user edits; un-edited types fall back to the current
  // server values, so no seeding effect is needed.
  function getForm(t: string): Form {
    const edited = forms[t];
    if (edited) return edited;
    const a = existing.find((x) => (x.animalType as string) === t);
    return {
      name: a?.name ?? "",
      price: String(a?.pricePerAnimal ?? 0),
      cover: !!a?.canCoverSlaughterCost,
    };
  }

  async function save(animalType: string) {
    const f = getForm(animalType);
    const n = Number(f.price);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Үнэ 0-ээс багагүй байх ёстой");
      return;
    }
    setBusy(animalType);
    await runMutation(
      async () =>
        (
          await upsert({
            variables: {
              animalType: animalType as never,
              name: f.name.trim() || null,
              pricePerAnimal: n,
              canCoverSlaughterCost: !!f.cover,
            },
          })
        ).data?.upsertAnimal,
      {
        success: `${f.name.trim() || animalName.get(animalType) || animalType}: хадгаллаа`,
        onSuccess: refetch,
      },
    );
    setBusy(null);
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
              <div className="text-base font-semibold">
                {animalName.get(t) ?? t}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Нэр</label>
                <Input
                  value={f.name}
                  onChange={(e) =>
                    setForms((s) => ({
                      ...s,
                      [t]: { ...getForm(t), name: e.target.value },
                    }))
                  }
                  placeholder="Жишээ нь: Үхэр"
                  className="h-11 text-base"
                />
              </div>
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
                {busy === t ? "..." : "Хадгалах"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
