"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ByproductWrapperListDoc } from "@/lib/queries/byproduct-wrapper";
import { InventoryStockDoc } from "@/lib/queries/inventory";
import { CreateByproductProcessingDoc } from "@/lib/queries/byproduct-processing";
import type { Factory } from "@/lib/gql/graphql";
import { BYPRODUCT_FACTORY } from "@/lib/format/enum";
import { formatNumber, sanitizeDecimalInput } from "@/lib/format/money";
import { compact } from "@/lib/compact";
import { runMutation } from "@/lib/runMutation";
import { Diff } from "./Diff";

const F3 = BYPRODUCT_FACTORY as Factory;

// One disassembly batch: N гэдэс of one wrapper → weigh every organ. Expected
// kg is the norm guess (N × per-animal qty × avg kg/piece); the actual is what
// the scale says. Always booked to the byproduct factory's stock.
export function ProcessingForm() {
  const router = useRouter();
  const { data: wd } = useQuery(ByproductWrapperListDoc, {
    variables: { isActive: true },
  });
  const { data: sd } = useQuery(InventoryStockDoc, {
    variables: { factory: F3, productType: "BYPRODUCT" },
    fetchPolicy: "cache-and-network",
  });
  const [create] = useMutation(CreateByproductProcessingDoc);
  const [wrapperId, setWrapperId] = useState("");
  const [bundleCount, setBundleCount] = useState("");
  const [actual, setActual] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const wrappers = compact(wd?.byproductWrappers?.byproductWrappers);
  const stock = compact(sd?.inventoryStock?.inventoryItems);
  // гэдэс on hand at F3 for a wrapper (stock SKU = animal + wrapper name).
  const availableFor = (w: (typeof wrappers)[number]) =>
    stock
      .filter(
        (s) => s.animal?.name === w.animalType && s.byproductName === w.name,
      )
      .reduce((a, s) => a + (s.quantityCount ?? 0), 0);

  const w = wrappers.find((x) => x.id === wrapperId);
  const items = compact(w?.items).filter((i) => i.isActive);
  const available = w ? availableFor(w) : 0;
  const n = Math.floor(Number(bundleCount)) || 0;

  async function onSubmit() {
    if (!w) return toast.error("Гэдэс сонгоно уу");
    if (n <= 0) return toast.error("Задлах гэдэсний тоо оруулна уу");
    if (n > available)
      return toast.error(`Үлдэгдэл хүрэлцэхгүй: ${available} ш байна`);
    if (items.length === 0) return toast.error("Энэ гэдэст норм алга");
    const missing = items.find((i) => !actual[i.id!]?.trim());
    if (missing) return toast.error(`${missing.name}: бодит жин оруулна уу`);

    setBusy(true);
    await runMutation(
      async () =>
        (
          await create({
            variables: {
              factory: F3,
              wrapperId: w.id!,
              bundleCount: n,
              lines: items.map((i) => ({
                constantId: i.id!,
                actualKg: Number(actual[i.id!]),
              })),
              notes: notes.trim() || null,
            },
          })
        ).data?.createByproductProcessing,
      {
        success: (d) => `${d.processing?.code ?? "Задлалт"} хадгалагдлаа`,
        onSuccess: () => {
          router.push("/byproduct-processing");
          router.refresh();
        },
      },
    );
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-base">Гэдэс</Label>
            <Select
              value={wrapperId}
              onValueChange={(v) => {
                if (!v) return;
                setWrapperId(v);
                setActual({});
              }}
            >
              <SelectTrigger className="h-12 w-full">
                <SelectValue placeholder="Сонгох">
                  {w ? (
                    <span>
                      {w.animalType} · {w.name}
                    </span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {wrappers.map((x) => (
                  <SelectItem key={x.id!} value={x.id!}>
                    {x.animalType} · {x.name} ({availableFor(x)} ш)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {w ? (
              <div className="text-xs text-muted-foreground">
                Үйлдвэр 3-т байгаа: {available} ш
              </div>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Задлах гэдэс (ш)</Label>
            <Input
              inputMode="numeric"
              value={bundleCount}
              onChange={(e) =>
                setBundleCount(e.target.value.replace(/\D/g, ""))
              }
              className="h-12 text-lg"
            />
            {w && n > available ? (
              <div className="text-xs text-destructive">
                Үлдэгдлээс их байна ({available} ш)
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {w ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="text-lg font-semibold">Эрхтэн тус бүрийн жин</div>
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Энэ гэдэст идэвхтэй норм алга. «Дайвар норм» хэсэгт нэмнэ үү.
              </div>
            ) : (
              <ul className="divide-y">
                {items.map((i) => {
                  const expectedCount = n * (i.quantityPerAnimal ?? 0);
                  const expectedKg =
                    i.unitWeightKg != null
                      ? expectedCount * i.unitWeightKg
                      : null;
                  const raw = actual[i.id!] ?? "";
                  return (
                    <li
                      key={i.id!}
                      className="flex flex-wrap items-center gap-3 py-2.5"
                    >
                      <div className="min-w-32 flex-1">
                        <div className="font-medium">{i.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {expectedCount} ш · хүлээгдсэн{" "}
                          {expectedKg != null
                            ? `${formatNumber(expectedKg)} кг`
                            : "—"}
                        </div>
                      </div>
                      <Input
                        inputMode="decimal"
                        placeholder="Бодит кг"
                        aria-label={`${i.name} бодит жин`}
                        value={raw}
                        onChange={(e) =>
                          setActual((s) => ({
                            ...s,
                            [i.id!]: sanitizeDecimalInput(e.target.value),
                          }))
                        }
                        className="h-11 w-32 text-right text-lg tabular-nums"
                      />
                      <div className="w-40 text-right text-sm">
                        {raw ? (
                          <Diff expected={expectedKg} actual={Number(raw)} />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Textarea
              placeholder="Тэмдэглэл (заавал биш)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Button
        size="lg"
        className="h-14 w-full text-lg"
        disabled={busy || !w}
        onClick={onSubmit}
      >
        {busy ? "Хадгалж байна…" : "Задлалт хадгалах"}
      </Button>
    </div>
  );
}
