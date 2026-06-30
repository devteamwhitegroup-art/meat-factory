"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import type { ResultOf } from "@graphql-typed-document-node/core";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { AnimalListDoc, UpsertAnimalDoc } from "@/lib/queries/animal";
import { runMutation } from "@/lib/runMutation";

type Animal = NonNullable<
  NonNullable<
    NonNullable<ResultOf<typeof AnimalListDoc>["animals"]>["animals"]
  >[number]
>;

type Form = {
  name: string;
  isExport: boolean;
  price: string;
  cover: boolean;
  yield: string;
  isActive: boolean;
};

const EMPTY: Form = {
  name: "",
  isExport: false,
  price: "0",
  cover: false,
  yield: "",
  isActive: true,
};

function fromAnimal(a: Animal): Form {
  return {
    name: a.name ?? "",
    isExport: !!a.isExport,
    price: String(a.pricePerAnimal ?? 0),
    cover: !!a.canCoverSlaughterCost,
    yield: a.yieldPercent != null ? String(a.yieldPercent) : "",
    isActive: a.isActive ?? true,
  };
}

// Admin catalogue: every animal is a card (create = the trailing blank card).
// `name` is the key — also the value stored as `animalType` everywhere else —
// and editing it on an existing row (with its id) renames in place.
export function AnimalsClient() {
  const { animals, loading, refetch } = useAnimalCatalog();
  const [upsert] = useMutation(UpsertAnimalDoc);
  const [edits, setEdits] = useState<Record<string, Form>>({});
  const [newForm, setNewForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState<string | null>(null);

  async function save(id: string | null, f: Form) {
    const name = f.name.trim();
    if (!name) {
      toast.error("Нэр оруулна уу");
      return;
    }
    const price = Number(f.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Үнэ 0-ээс багагүй байх ёстой");
      return;
    }
    const yieldPercent = f.yield.trim() ? Number(f.yield) : null;
    if (
      yieldPercent != null &&
      (!Number.isFinite(yieldPercent) || yieldPercent < 0)
    ) {
      toast.error("Гарц 0-ээс багагүй байх ёстой");
      return;
    }
    setBusy(id ?? "new");
    await runMutation(
      async () =>
        (
          await upsert({
            variables: {
              id,
              name,
              isExport: f.isExport,
              pricePerAnimal: price,
              canCoverSlaughterCost: f.cover,
              yieldPercent,
              isActive: f.isActive,
            },
          })
        ).data?.upsertAnimal,
      {
        success: `${name}: хадгаллаа`,
        onSuccess: () => {
          if (id)
            setEdits((s) => {
              const n = { ...s };
              delete n[id];
              return n;
            });
          else setNewForm(EMPTY);
          refetch();
        },
      },
    );
    setBusy(null);
  }

  if (loading && animals.length === 0) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {animals.map((a) => {
        const id = a.id!;
        const f = edits[id] ?? fromAnimal(a);
        return (
          <AnimalCard
            key={id}
            form={f}
            busy={busy === id}
            saveLabel="Хадгалах"
            onChange={(p) => setEdits((s) => ({ ...s, [id]: { ...f, ...p } }))}
            onSave={() => save(id, f)}
          />
        );
      })}
      <AnimalCard
        form={newForm}
        busy={busy === "new"}
        saveLabel="Шинээр нэмэх"
        isNew
        onChange={(p) => setNewForm((s) => ({ ...s, ...p }))}
        onSave={() => save(null, newForm)}
      />
    </div>
  );
}

function AnimalCard({
  form,
  busy,
  saveLabel,
  isNew,
  onChange,
  onSave,
}: {
  form: Form;
  busy: boolean;
  saveLabel: string;
  isNew?: boolean;
  onChange: (patch: Partial<Form>) => void;
  onSave: () => void;
}) {
  return (
    <Card className={isNew ? "border-dashed" : undefined}>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Нэр</label>
          <Input
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={isNew ? "Шинэ мал — ж: Үхэр" : "Жишээ нь: Үхэр"}
            className="h-11 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Бой зардал (₮)
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => onChange({ price: e.target.value })}
              placeholder="₮"
              className="h-11 text-right text-base tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Гарц (%)</label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.yield}
              onChange={(e) => onChange({ yield: e.target.value })}
              placeholder="%"
              className="h-11 text-right text-base tabular-nums"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.cover}
            onCheckedChange={(c) => onChange({ cover: !!c })}
          />
          <span>Дайвараар бой зардлыг нөхөх боломжтой</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.isExport}
            onCheckedChange={(c) => onChange({ isExport: !!c })}
          />
          <span>Экспортын мал</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.isActive}
            onCheckedChange={(c) => onChange({ isActive: !!c })}
          />
          <span>Идэвхтэй</span>
        </label>
        <Button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="w-full"
        >
          {busy ? "..." : saveLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
