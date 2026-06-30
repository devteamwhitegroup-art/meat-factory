"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  CreateHerderAddressDoc,
  DeleteHerderAddressDoc,
  HerderAddressListDoc,
  UpdateHerderAddressDoc,
} from "@/lib/queries/herder-address";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

type Form = { id?: string; name: string };

export function HerderAddressesClient() {
  const { data, loading, refetch } = useQuery(HerderAddressListDoc, {
    variables: { search: null, isActive: null },
    fetchPolicy: "cache-and-network",
  });
  const [createRow] = useMutation(CreateHerderAddressDoc);
  const [updateRow] = useMutation(UpdateHerderAddressDoc);
  const [deleteRow] = useMutation(DeleteHerderAddressDoc);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<Form>({ name: "" });
  const rows = compact(data?.herderAddresses?.herderAddresses);

  function openCreate() {
    setForm({ name: "" });
    setSheetOpen(true);
  }

  function openEdit(r: { id?: string | null; name?: string | null }) {
    setForm({ id: r.id ?? undefined, name: r.name ?? "" });
    setSheetOpen(true);
  }

  async function onSave() {
    const name = form.name.trim();
    if (!name) {
      toast.error("Хаягийн нэр оруулна уу");
      return;
    }
    await runMutation(
      async () => {
        if (form.id) {
          const r = await updateRow({ variables: { id: form.id, name } });
          return r.data?.updateHerderAddress;
        }
        const r = await createRow({ variables: { name } });
        return r.data?.createHerderAddress;
      },
      {
        success: "Хадгалагдлаа",
        onSuccess: () => {
          setSheetOpen(false);
          refetch();
        },
      },
    );
  }

  async function toggleActive(id: string, isActive: boolean) {
    await runMutation(
      async () =>
        (await updateRow({ variables: { id, isActive: !isActive } })).data
          ?.updateHerderAddress,
      { onSuccess: refetch },
    );
  }

  async function onDelete(id: string) {
    if (!confirm("Энэ хаягийг устгах уу?")) return;
    await runMutation(
      async () =>
        (await deleteRow({ variables: { id } })).data?.deleteHerderAddress,
      { success: "Устгагдлаа", onSuccess: refetch },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>Шинэ хаяг</Button>
      </div>

      {loading && rows.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Хаяг алга. «Шинэ хаяг» дарж эхний бичлэгийг үүсгэнэ үү.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead className="w-32">Төлөв</TableHead>
                <TableHead className="w-44 text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id!}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleActive(r.id!, r.isActive ?? false)}
                    >
                      <Badge
                        className={
                          r.isActive
                            ? "border-0 bg-emerald-100 text-emerald-800"
                            : "border-0 bg-rose-100 text-rose-800"
                        }
                      >
                        {r.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(r)}
                    >
                      Засах
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(r.id!)}
                    >
                      Устгах
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{form.id ? "Хаяг засах" : "Шинэ хаяг"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label>Хаягийн нэр</Label>
              <Input
                placeholder="ж: Дорнод аймаг, Хэрлэн сум"
                value={form.name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, name: e.target.value }))
                }
              />
            </div>
            <Button className="w-full" onClick={onSave}>
              Хадгалах
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
