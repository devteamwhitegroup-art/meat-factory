"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeypadField } from "@/components/forms/KeypadField";
import { AddCargoEntryDoc } from "@/lib/queries/shipment";
import { ByproductWrapperListDoc } from "@/lib/queries/byproduct-wrapper";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { formatNumber } from "@/lib/format/money";

// ─── Add cargo line ──────────────────────────────────────────────────
//
// One row of the loading manifest. A product-type toggle switches between:
//   • Мах (MEAT)     → animalType dropdown (locked to HORSE on EXPORT)
//   • Дайвар (BYPRODUCT, DOMESTIC only) → cascading animal → wrapper →
//     constant picker, reusing the /byproduct-constants admin catalogue.
// Weight is captured the same way as before (gross/tare or a direct net).
// No price here — pricing happens once per sale-line at the end of loading.
type ProductType = "MEAT" | "BYPRODUCT";

export function CargoLineForm({
  shipmentId,
  category,
  onChanged,
}: {
  shipmentId: string;
  category: string;
  onChanged: () => void;
}) {
  const isExport = category === "EXPORT";

  const { animals, animalTypes } = useAnimalCatalog();
  const [addEntry, { loading: adding }] = useMutation(AddCargoEntryDoc);

  // Meat animal options: export shipments only carry export-marked animals
  // (server-enforced too); domestic carries any active animal.
  const meatOptions = animals.flatMap((a) =>
    a.isActive && a.name && (!isExport || a.isExport) ? [a.name] : [],
  );

  const [productType, setProductType] = useState<ProductType>("MEAT");
  const [animalType, setAnimalType] = useState<string>("");
  // Byproduct cascade.
  const [bpAnimal, setBpAnimal] = useState<string>("");
  const [bpWrapperId, setBpWrapperId] = useState<string>("");
  const [bpConstantId, setBpConstantId] = useState<string>("");
  // Weights.
  const [pieces, setPieces] = useState("");
  const [gross, setGross] = useState("");
  const [tare, setTare] = useState("");

  // Byproduct catalogue for the chosen animal (active wrappers only).
  const { data: catData } = useQuery(ByproductWrapperListDoc, {
    variables: { animalType: bpAnimal, isActive: true },
    skip: productType !== "BYPRODUCT" || !bpAnimal,
    fetchPolicy: "cache-and-network",
  });
  const wrappers = compact(catData?.byproductWrappers?.byproductWrappers);
  const selectedWrapper = wrappers.find((w) => w.id === bpWrapperId) ?? null;
  const constants = compact(selectedWrapper?.items).filter((i) => i.isActive);

  // Live net preview from gross − tare.
  const previewNet = useMemo(() => {
    const g = Number(gross);
    const t = Number(tare);
    if (Number.isFinite(g) && g > 0 && Number.isFinite(t) && t >= 0 && t < g) {
      return Number((g - t).toFixed(2));
    }
    return null;
  }, [gross, tare]);

  function resetWeights() {
    setPieces("");
    setGross("");
    setTare("");
  }

  async function onAdd() {
    const meatAnimal = animalType;
    if (productType === "MEAT" && !meatAnimal) {
      toast.error("Малын төрөл сонгоно уу");
      return;
    }
    if (productType === "BYPRODUCT" && !bpConstantId) {
      toast.error("Дайвар сонгоно уу");
      return;
    }

    const pcs = pieces.trim() ? Number(pieces) : null;
    const g = gross.trim() ? Number(gross) : null;
    const t = tare.trim() ? Number(tare) : null;
    const haveGrossTare = g != null && t != null;
    if (!haveGrossTare && previewNet == null) {
      toast.error("Ястай махны жин + Цул махны жин оруулна уу");
      return;
    }

    await runMutation(
      async () =>
        (
          await addEntry({
            variables: {
              shipmentId,
              productType,
              animalType: productType === "MEAT" ? meatAnimal : null,
              // The server derives byproductName from the constant; we don't
              // send a free-typed name.
              sourceConstantId:
                productType === "BYPRODUCT" ? bpConstantId : null,
              pieceCount: pcs,
              grossKg: g,
              tareKg: t,
              // Send net only when gross/tare aren't both supplied — the BE
              // prefers gross-minus-tare when present.
              weightKg: haveGrossTare ? null : previewNet,
            },
          })
        ).data?.addCargoEntry,
      {
        onSuccess: () => {
          // Keep the product selection sticky for fast multi-row entry; just
          // clear the weights.
          resetWeights();
          onChanged();
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ачаа нэмэх</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product-type toggle. Byproduct is domestic-only. */}
        <Tabs
          value={productType}
          onValueChange={(v) => setProductType(v as ProductType)}
        >
          <TabsList>
            <TabsTrigger value="MEAT">Мах</TabsTrigger>
            {!isExport ? (
              <TabsTrigger value="BYPRODUCT">Дайвар</TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>

        {productType === "MEAT" ? (
          <div className="space-y-1.5 max-w-xs">
            <Label className="text-xs">Малын төрөл</Label>
            <Select
              value={animalType || undefined}
              onValueChange={(v) => setAnimalType(v ?? "")}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Мал сонгоно уу" />
              </SelectTrigger>
              <SelectContent>
                {meatOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isExport ? (
              <p className="text-xs text-muted-foreground">
                Экспортын ачилтад зөвхөн экспортын мал сонгоно.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Мал</Label>
              <Select
                value={bpAnimal || undefined}
                onValueChange={(v) => {
                  setBpAnimal(v ?? "");
                  setBpWrapperId("");
                  setBpConstantId("");
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Мал" />
                </SelectTrigger>
                <SelectContent>
                  {animalTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Багц</Label>
              <Select
                value={bpWrapperId || undefined}
                onValueChange={(v) => {
                  setBpWrapperId(v ?? "");
                  setBpConstantId("");
                }}
                disabled={!bpAnimal || wrappers.length === 0}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Багц" />
                </SelectTrigger>
                <SelectContent>
                  {wrappers.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Багц алга
                    </div>
                  ) : (
                    wrappers.map((w) => (
                      <SelectItem key={w.id!} value={w.id!}>
                        {w.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Дайвар</Label>
              <Select
                value={bpConstantId || undefined}
                onValueChange={(v) => setBpConstantId(v ?? "")}
                disabled={!bpWrapperId || constants.length === 0}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Дайвар" />
                </SelectTrigger>
                <SelectContent>
                  {constants.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Дайвар алга
                    </div>
                  ) : (
                    constants.map((c) => (
                      <SelectItem key={c.id!} value={c.id!}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Weights — gross/tare or a direct net. */}
        <div className="grid gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs">ш (тоо)</Label>
            <KeypadField
              value={pieces}
              onChange={setPieces}
              label="ш (тоо)"
              className="h-11 cursor-pointer text-right tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Нийт махны жин (кг)</Label>
            <KeypadField
              value={gross}
              onChange={setGross}
              label="Нийт махны жин (кг)"
              className="h-11 cursor-pointer text-right tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Сав (кг)</Label>
            <KeypadField
              value={tare}
              onChange={setTare}
              label="Савны жин (кг)"
              className="h-11 cursor-pointer text-right tabular-nums"
            />
          </div>
          <div className="flex items-end">
            <Button className="h-11 w-full" onClick={onAdd} disabled={adding}>
              {adding ? "..." : "Нэмэх"}
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Цэвэр жин:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {previewNet != null ? `${formatNumber(previewNet)} кг` : "—"}
          </span>{" "}
          · Нийт махны жин − Сав. Зөвхөн цэвэр жинтэй бол Нийт махны/Сав хоосон
          үлдээ ба Сав талбарт цэвэр жинг бичээрэй.
        </div>
      </CardContent>
    </Card>
  );
}
