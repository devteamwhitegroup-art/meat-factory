"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ByproductWrapperListDoc,
  CreateByproductWrapperDoc,
  DeleteByproductWrapperDoc,
  UpdateByproductWrapperDoc,
} from "@/lib/queries/byproduct-wrapper";
import {
  CreateByproductConstantDoc,
  DeleteByproductConstantDoc,
  UpdateByproductConstantDoc,
} from "@/lib/queries/byproduct-constant";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

type WrapperForm = { id?: string; name: string };
type ItemForm = {
  id?: string;
  wrapperId: string;
  name: string;
  qty: string;
  unitWeight: string;
};

export function ByproductConstantsClient() {
  const { animalTypes, animalName } = useAnimalCatalog();
  const [animalType, setAnimalType] = useState<string>("COW");
  const { data, loading, refetch } = useQuery(ByproductWrapperListDoc, {
    variables: { animalType: animalType as never, isActive: null },
    fetchPolicy: "cache-and-network",
  });

  const [createWrapper] = useMutation(CreateByproductWrapperDoc);
  const [updateWrapper] = useMutation(UpdateByproductWrapperDoc);
  const [deleteWrapper] = useMutation(DeleteByproductWrapperDoc);
  const [createItem] = useMutation(CreateByproductConstantDoc);
  const [updateItem] = useMutation(UpdateByproductConstantDoc);
  const [deleteItem] = useMutation(DeleteByproductConstantDoc);

  const [wrapperSheet, setWrapperSheet] = useState(false);
  const [wrapperForm, setWrapperForm] = useState<WrapperForm>({
    name: "",
  });
  const [itemSheet, setItemSheet] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>({
    wrapperId: "",
    name: "",
    qty: "1",
    unitWeight: "",
  });

  const wrappers = compact(data?.byproductWrappers?.byproductWrappers);

  // ── wrapper handlers ──
  function openCreateWrapper() {
    setWrapperForm({ name: "" });
    setWrapperSheet(true);
  }
  function openEditWrapper(w: { id?: string | null; name?: string | null }) {
    setWrapperForm({
      id: w.id ?? undefined,
      name: w.name ?? "",
    });
    setWrapperSheet(true);
  }
  async function saveWrapper() {
    if (!wrapperForm.name.trim()) {
      toast.error("Багцын нэр оруулна уу");
      return;
    }
    await runMutation(
      async () => {
        if (wrapperForm.id) {
          const r = await updateWrapper({
            variables: {
              id: wrapperForm.id,
              name: wrapperForm.name.trim(),
            },
          });
          return r.data?.updateByproductWrapper;
        }
        const r = await createWrapper({
          variables: {
            animalType: animalType as never,
            name: wrapperForm.name.trim(),
          },
        });
        return r.data?.createByproductWrapper;
      },
      {
        success: "Хадгалагдлаа",
        onSuccess: () => {
          setWrapperSheet(false);
          refetch();
        },
      },
    );
  }
  async function toggleWrapperActive(id: string, isActive: boolean) {
    await runMutation(
      async () =>
        (await updateWrapper({ variables: { id, isActive: !isActive } })).data
          ?.updateByproductWrapper,
      { onSuccess: refetch },
    );
  }
  async function removeWrapper(id: string) {
    if (!confirm("Багц болон доторх дайваруудыг устгах уу?")) return;
    await runMutation(
      async () =>
        (await deleteWrapper({ variables: { id } })).data
          ?.deleteByproductWrapper,
      { success: "Устгагдлаа", onSuccess: refetch },
    );
  }

  // ── item handlers ──
  function openCreateItem(wrapperId: string) {
    setItemForm({ wrapperId, name: "", qty: "1", unitWeight: "" });
    setItemSheet(true);
  }
  function openEditItem(item: {
    id?: string | null;
    wrapperId?: string | null;
    name?: string | null;
    quantityPerAnimal?: number | null;
    unitWeightKg?: number | null;
  }) {
    setItemForm({
      id: item.id ?? undefined,
      wrapperId: item.wrapperId ?? "",
      name: item.name ?? "",
      qty: String(item.quantityPerAnimal ?? 1),
      unitWeight: item.unitWeightKg != null ? String(item.unitWeightKg) : "",
    });
    setItemSheet(true);
  }
  async function saveItem() {
    if (!itemForm.name.trim()) {
      toast.error("Дайврын нэр оруулна уу");
      return;
    }
    if (Number(itemForm.qty) < 1) {
      toast.error("Тоо хэмжээ 1-ээс багагүй");
      return;
    }
    const weight = itemForm.unitWeight.trim()
      ? Number(itemForm.unitWeight)
      : null;
    await runMutation(
      async () => {
        if (itemForm.id) {
          const r = await updateItem({
            variables: {
              id: itemForm.id,
              name: itemForm.name.trim(),
              quantityPerAnimal: Math.floor(Number(itemForm.qty)),
              unitWeightKg: weight,
            },
          });
          return r.data?.updateByproductConstant;
        }
        const r = await createItem({
          variables: {
            wrapperId: itemForm.wrapperId,
            name: itemForm.name.trim(),
            quantityPerAnimal: Math.floor(Number(itemForm.qty)),
            unitWeightKg: weight,
          },
        });
        return r.data?.createByproductConstant;
      },
      {
        success: "Хадгалагдлаа",
        onSuccess: () => {
          setItemSheet(false);
          refetch();
        },
      },
    );
  }
  async function removeItem(id: string) {
    if (!confirm("Дайвар устгах уу?")) return;
    await runMutation(
      async () =>
        (await deleteItem({ variables: { id } })).data?.deleteByproductConstant,
      { success: "Устгагдлаа", onSuccess: refetch },
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={animalType}
        onValueChange={(v) => setAnimalType(v as string)}
      >
        <TabsList>
          {animalTypes.map((t) => (
            <TabsTrigger key={t} value={t}>
              {animalName.get(t) ?? t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {animalName.get(animalType) ?? animalType} — дайвар багцууд
        </div>
        <Button onClick={openCreateWrapper}>Шинэ багц</Button>
      </div>

      {loading && wrappers.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : wrappers.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Багц алга. «Шинэ багц» дарж үүсгэнэ үү (ж: Адууны өлөн гэдэс).
        </div>
      ) : (
        <div className="space-y-4">
          {wrappers.map((w) => (
            <Card key={w.id!}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{w.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      toggleWrapperActive(w.id!, w.isActive ?? false)
                    }
                  >
                    <Badge
                      className={
                        w.isActive
                          ? "border-0 bg-emerald-100 text-emerald-800"
                          : "border-0 bg-rose-100 text-rose-800"
                      }
                    >
                      {w.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                    </Badge>
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCreateItem(w.id!)}
                  >
                    Дайвар нэмэх
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditWrapper(w)}
                  >
                    Засах
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeWrapper(w.id!)}
                  >
                    Устгах
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {compact(w.items).length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Дайвар алга — «Дайвар нэмэх» дарна уу.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дайвар</TableHead>
                        <TableHead>1 малд (ширхэг)</TableHead>
                        <TableHead>Нэгж жин (кг)</TableHead>
                        <TableHead>Үйлдэл</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compact(w.items).map((it) => (
                        <TableRow key={it.id!}>
                          <TableCell className="font-medium">
                            {it.name}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {it.quantityPerAnimal}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {it.unitWeightKg ?? "—"}
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditItem(it)}
                            >
                              Засах
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(it.id!)}
                            >
                              Устгах
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wrapper sheet */}
      <Sheet open={wrapperSheet} onOpenChange={setWrapperSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {wrapperForm.id ? "Багц засах" : "Шинэ багц"} —{" "}
              {animalName.get(animalType) ?? animalType}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label>Багцын нэр</Label>
              <Input
                placeholder="ж: Адууны өлөн гэдэс"
                value={wrapperForm.name}
                onChange={(e) =>
                  setWrapperForm((s) => ({ ...s, name: e.target.value }))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Дайвар бой зардал нөхөх эсэх нь «Малын тохиргоо» хэсэгт мал тус
              бүрд тохируулна.
            </p>
            <Button className="w-full" onClick={saveWrapper}>
              Хадгалах
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Item sheet */}
      <Sheet open={itemSheet} onOpenChange={setItemSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {itemForm.id ? "Дайвар засах" : "Шинэ дайвар"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label>Дайврын нэр</Label>
              <Input
                placeholder="ж: Зүрх, Уушги, Гүзээ"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm((s) => ({ ...s, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>1 малд оногдох тоо (ширхэг)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={itemForm.qty}
                onChange={(e) =>
                  setItemForm((s) => ({ ...s, qty: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Нэгжийн дундаж жин (кг, заавал биш)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={itemForm.unitWeight}
                onChange={(e) =>
                  setItemForm((s) => ({ ...s, unitWeight: e.target.value }))
                }
              />
            </div>
            <Button className="w-full" onClick={saveItem}>
              Хадгалах
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
