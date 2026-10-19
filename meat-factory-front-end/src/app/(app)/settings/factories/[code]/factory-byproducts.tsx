"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import type { ResultOf } from "@graphql-typed-document-node/core";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DeleteFactoryByproductDoc,
  FactoryByproductsDoc,
  SetFactoryByproductDoc,
} from "@/lib/queries/factory";
import { ByproductWrapperListDoc } from "@/lib/queries/byproduct-wrapper";
import type { FactoryKind } from "@/lib/factory/factories";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

type Wrapper = NonNullable<
  NonNullable<
    NonNullable<
      ResultOf<typeof ByproductWrapperListDoc>["byproductWrappers"]
    >["byproductWrappers"]
  >[number]
>;

const HINT: Record<string, string> = {
  LIVE_SLAUGHTER:
    "Бүртгэл бүрт эдгээр гэдэсийг малын тоогоор санал болгоно. Малчин авахгүй гэдэс бүрийн үнийг бой зардлаас хасна. Үнэ 0 бол малчнаас асуухгүй — үйлдвэрт үлдэнэ.",
  PRE_BUTCHERED:
    "Бүтэн багц (гэдэс) эсвэл дан дайвар сонгоно. Хүлээн авахдаа тоолох бөгөөд энд тохируулсан үнийг ажилтан тухайн өдрийн зах зээлээр өөрчилж болно.",
};

// Item-step option meaning "the whole wrapper, not one item inside it".
const WHOLE = "__whole";

// A site's byproduct price list. LIVE_SLAUGHTER prices whole гэдэс
// (wrappers); PRE_BUTCHERED picks whole гэдэс and/or single items
// (constants). Adding an entry that's already listed re-prices it (upsert).
export function FactoryByproducts({
  factory,
  kind,
}: {
  factory: string;
  kind: FactoryKind;
}) {
  const byItem = kind === "PRE_BUTCHERED";
  const { data, loading, refetch } = useQuery(FactoryByproductsDoc, {
    variables: { factory },
    fetchPolicy: "cache-and-network",
  });
  const { data: catalog } = useQuery(ByproductWrapperListDoc, {
    variables: { isActive: true },
    fetchPolicy: "cache-and-network",
  });
  const [setRow] = useMutation(SetFactoryByproductDoc);
  const [deleteRow] = useMutation(DeleteFactoryByproductDoc);

  // Cascading pick: animal → wrapper (→ item for PRE_BUTCHERED).
  const [animal, setAnimal] = useState("");
  const [wrapperId, setWrapperId] = useState("");
  const [constantId, setConstantId] = useState("");
  const [price, setPrice] = useState("");
  // Unsaved price edits per row id.
  const [edits, setEdits] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);

  const rows = compact(data?.factoryByproducts?.factoryByproducts);
  const listed = new Set(rows.map((r) => r.constantId ?? r.wrapperId));
  // Only what can still be added: unlisted wrappers, or (PRE_BUTCHERED)
  // wrappers that still hold an unlisted active item.
  const addableItems = (w: Wrapper) =>
    compact(w.items).filter((i) => i.isActive && !listed.has(i.id));
  const wrappers = compact(catalog?.byproductWrappers?.byproductWrappers)
    .filter((w) => !listed.has(w.id) || (byItem && addableItems(w).length > 0))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  const animals = [...new Set(wrappers.map((w) => w.animalType ?? ""))].sort();
  const animalWrappers = wrappers.filter((w) => w.animalType === animal);
  const wrapper = animalWrappers.find((w) => w.id === wrapperId);
  const itemOptions = wrapper
    ? [
        ...(listed.has(wrapper.id) ? [] : [{ id: WHOLE, label: "Бүтэн багц" }]),
        ...addableItems(wrapper).map((i) => ({ id: i.id!, label: i.name! })),
      ]
    : [];
  const target = !wrapper
    ? null
    : !byItem || constantId === WHOLE
      ? { wrapperId: wrapper.id! }
      : constantId
        ? { constantId }
        : null;

  async function save(
    target: { wrapperId?: string | null; constantId?: string | null },
    raw: string,
  ): Promise<boolean> {
    const p = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(p) || p < 0) {
      toast.error("Үнэ 0-ээс багагүй байх ёстой");
      return false;
    }
    setBusy(true);
    const ok = await runMutation(
      async () =>
        (
          await setRow({
            variables: {
              factory,
              wrapperId: target.wrapperId ?? null,
              constantId: target.constantId ?? null,
              price: p,
            },
          })
        ).data?.setFactoryByproduct,
      { success: "Хадгалагдлаа", onSuccess: refetch },
    );
    setBusy(false);
    return ok;
  }

  async function add() {
    if (!target)
      return void toast.error(
        byItem ? "Дайвар сонгоно уу" : "Гэдэс сонгоно уу",
      );
    const ok = await save(target, price);
    if (ok) {
      // Keep animal (+ wrapper for items) to add its siblings next.
      if (byItem) setConstantId("");
      else setWrapperId("");
      setPrice("");
    }
  }

  async function remove(id: string) {
    if (!confirm("Жагсаалтаас хасах уу?")) return;
    await runMutation(
      async () =>
        (await deleteRow({ variables: { id } })).data?.deleteFactoryByproduct,
      { success: "Хасагдлаа", onSuccess: refetch },
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">
          {byItem ? "Хүлээн авах дайвар" : "Гэдэс (багц)"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{HINT[kind]}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={
            byItem
              ? "grid gap-2 sm:grid-cols-[1fr_1fr_1fr_9rem_auto]"
              : "grid gap-2 sm:grid-cols-[1fr_1fr_9rem_auto]"
          }
        >
          <Choice
            placeholder="Мал"
            value={animal}
            options={animals.map((a) => ({ id: a, label: a }))}
            onChange={(v) => {
              setAnimal(v);
              setWrapperId("");
              setConstantId("");
            }}
          />
          <Choice
            placeholder="Багц"
            value={wrapperId}
            disabled={!animal}
            options={animalWrappers.map((w) => ({ id: w.id!, label: w.name! }))}
            onChange={(v) => {
              setWrapperId(v);
              setConstantId("");
            }}
          />
          {byItem ? (
            <Choice
              placeholder="Дайвар"
              value={constantId}
              disabled={!wrapper}
              options={itemOptions}
              onChange={setConstantId}
            />
          ) : null}
          <Input
            aria-label="Үнэ"
            inputMode="decimal"
            placeholder="Үнэ (₮)"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
            className="h-11 text-right tabular-nums"
          />
          <Button className="h-11" onClick={add} disabled={busy}>
            Нэмэх
          </Button>
        </div>

        {loading && rows.length === 0 ? (
          <Skeleton className="h-32 w-full" />
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Жагсаалт хоосон — дээрээс сонгож нэмнэ үү.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Мал</TableHead>
                  <TableHead>Нэр</TableHead>
                  <TableHead className="w-48 text-right">Үнэ (₮)</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const id = r.id!;
                  const edited = edits[id];
                  return (
                    <TableRow key={id}>
                      <TableCell>{r.animalType}</TableCell>
                      <TableCell className="font-medium">
                        {r.name}
                        {byItem && r.wrapperId ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            бүтэн багц
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label={`${r.name} үнэ`}
                          inputMode="decimal"
                          value={edited ?? String(r.price ?? 0)}
                          onChange={(e) =>
                            setEdits((s) => ({
                              ...s,
                              [id]: e.target.value.replace(/[^\d.]/g, ""),
                            }))
                          }
                          className="h-9 text-right tabular-nums"
                        />
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || edited === undefined}
                          onClick={async () => {
                            if (await save(r, edited ?? "")) {
                              setEdits((s) => ({ ...s, [id]: undefined }));
                            }
                          }}
                        >
                          Хадгалах
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Хасах"
                          onClick={() => remove(id)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// One step of the cascading pick. Value kept defined (`|| null`) so the
// Select stays controlled from the first render.
function Choice({
  placeholder,
  value,
  options,
  disabled,
  onChange,
}: {
  placeholder: string;
  value: string;
  options: { id: string; label: string }[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(v) => onChange(v ?? "")}
      disabled={disabled}
    >
      <SelectTrigger className="h-11">
        <SelectValue placeholder={placeholder}>
          {options.find((o) => o.id === value)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Нэмэх зүйл алга
          </div>
        ) : (
          options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
