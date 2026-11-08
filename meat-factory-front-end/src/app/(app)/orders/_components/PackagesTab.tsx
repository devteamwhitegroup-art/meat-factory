"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import type { ResultOf } from "@graphql-typed-document-node/core";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/common/ListState";
import {
  CreateOrderPackageDoc,
  DeleteOrderPackageDoc,
  OrderPackageListDoc,
  UpdateOrderPackageDoc,
} from "@/lib/queries/order";
import { formatMNT } from "@/lib/format/money";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

type Pkg = NonNullable<
  NonNullable<NonNullable<ResultOf<typeof OrderPackageListDoc>["orderPackages"]>["orderPackages"]>[number]
>;
type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  items: { name: string; kg: string }[];
};

const EMPTY: Draft = { name: "", description: "", price: "", items: [{ name: "", kg: "" }] };

export function PackagesTab() {
  const { data, loading, refetch } = useQuery(OrderPackageListDoc, {
    fetchPolicy: "cache-and-network",
  });
  const [createPkg] = useMutation(CreateOrderPackageDoc);
  const [updatePkg] = useMutation(UpdateOrderPackageDoc);
  const [deletePkg] = useMutation(DeleteOrderPackageDoc);
  const [draft, setDraft] = useState<Draft | null>(null);

  const pkgs = compact(data?.orderPackages?.orderPackages);

  const edit = (p: Pkg) =>
    setDraft({
      id: p.id!,
      name: p.name ?? "",
      description: p.description ?? "",
      price: String(p.price ?? ""),
      items: compact(p.items).map((i) => ({ name: i.name ?? "", kg: i.kg == null ? "" : String(i.kg) })),
    });

  const setItem = (i: number, k: "name" | "kg", v: string) =>
    setDraft((d) => d && { ...d, items: d.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) });

  async function save() {
    if (!draft) return;
    const price = Number(draft.price);
    if (!draft.name.trim() || !Number.isInteger(price) || price <= 0) {
      toast.error("Нэр, үнэ (бүхэл тоо) оруулна уу");
      return;
    }
    const vars = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      price,
      items: draft.items
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), kg: i.kg ? Number(i.kg) : null })),
    };
    await runMutation(
      async () =>
        draft.id
          ? (await updatePkg({ variables: { id: draft.id, ...vars } })).data?.updateOrderPackage
          : (await createPkg({ variables: vars })).data?.createOrderPackage,
      {
        success: draft.id ? "Шинэчлэгдлээ" : "Багц нэмэгдлээ",
        onSuccess: () => {
          setDraft(null);
          refetch();
        },
      },
    );
  }

  const toggle = (p: Pkg) =>
    runMutation(
      async () => (await updatePkg({ variables: { id: p.id!, isActive: !p.isActive } })).data?.updateOrderPackage,
      { onSuccess: refetch },
    );

  const remove = (p: Pkg) =>
    confirm(`"${p.name}" багцыг устгах уу?`) &&
    runMutation(async () => (await deletePkg({ variables: { id: p.id! } })).data?.deleteOrderPackage, {
      success: "Устгагдлаа",
      onSuccess: refetch,
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDraft(EMPTY)}>Шинэ багц</Button>
      </div>

      {loading && pkgs.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : pkgs.length === 0 ? (
        <EmptyState>Багц алга. «Шинэ багц» дарж эхний багцаа нэмнэ үү — вэб сайтад шууд харагдана.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pkgs.map((p) => (
            <div key={p.id!} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="text-xl font-bold">{formatMNT(p.price)}</div>
                </div>
                <button type="button" onClick={() => toggle(p)}>
                  <Badge
                    className={
                      p.isActive
                        ? "border-0 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                        : "border-0 bg-muted text-muted-foreground"
                    }
                  >
                    {p.isActive ? "Сайтад харагдана" : "Нуусан"}
                  </Badge>
                </button>
              </div>
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <ul className="space-y-1 text-sm">
                {compact(p.items).map((i, k) => (
                  <li key={k} className="flex justify-between gap-2 border-b border-dashed pb-1">
                    <span>{i.name}</span>
                    {i.kg != null && <span className="tabular-nums">{i.kg} кг</span>}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(p)}>
                  Засах
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                  Устгах
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{draft?.id ? "Багц засах" : "Шинэ багц"}</SheetTitle>
          </SheetHeader>
          {draft && (
            <div className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-name">Нэр</Label>
                <Input
                  id="pkg-name"
                  placeholder="Өвлийн идэш — гэр бүлийн"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-price">Үнэ (₮)</Label>
                <Input
                  id="pkg-price"
                  inputMode="numeric"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-desc">Тайлбар</Label>
                <Textarea
                  id="pkg-desc"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Махны хэсгүүд</Label>
                {draft.items.map((it, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Үхрийн өвчүү"
                      value={it.name}
                      onChange={(e) => setItem(i, "name", e.target.value)}
                    />
                    <Input
                      className="w-24"
                      placeholder="кг"
                      inputMode="decimal"
                      value={it.kg}
                      onChange={(e) => setItem(i, "kg", e.target.value.replace(/[^\d.]/g, ""))}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Хасах"
                      onClick={() => setDraft({ ...draft, items: draft.items.filter((_, j) => j !== i) })}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDraft({ ...draft, items: [...draft.items, { name: "", kg: "" }] })}
                >
                  <Plus className="size-4" /> Хэсэг нэмэх
                </Button>
              </div>
              <Button className="w-full" onClick={save}>
                Хадгалах
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
