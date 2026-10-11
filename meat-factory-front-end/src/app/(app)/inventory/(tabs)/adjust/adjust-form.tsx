"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDraft } from "@/lib/hooks/useDraft";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdjustInventoryDoc } from "@/lib/queries/inventory";
import { unwrap } from "@/lib/unwrap";
import { MOVEMENT_TYPE_MN, PRODUCT_TYPE_MN } from "@/lib/format/enum";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { ByproductNamePicker } from "@/components/common/ByproductNamePicker";
import { useFactories } from "@/lib/factory/FactoriesProvider";

// crossFactory = owner/admin: stock is per factory — the one picked in the
// page header's factory filter (`factory`). Staff adjust their own factory
// (BE-stamped).
export function AdjustForm({
  crossFactory,
  factory,
}: {
  crossFactory: boolean;
  factory: string | null;
}) {
  const router = useRouter();
  const { nameOf } = useFactories();
  const { animals } = useAnimalCatalog();
  const [adjust] = useMutation(AdjustInventoryDoc);
  const [productType, setProductType] = useState<"MEAT" | "BYPRODUCT">("MEAT");
  const [animalId, setAnimalId] = useState("");
  const [byproductName, setByproductName] = useState("");
  // Byproduct stock is per animal (SKU Дайвар:<animal>:<name>).
  const [byproductAnimal, setByproductAnimal] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  // Pieces — byproduct only (counted гэдэс); meat is always kg.
  const [quantityCount, setQuantityCount] = useState("");
  const [direction, setDirection] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const clearDraft = useDraft(
    "inventory:adjust",
    {
      productType,
      animalId,
      byproductName,
      byproductAnimal,
      quantityKg,
      quantityCount,
      direction,
      notes,
    },
    (d) => {
      setProductType(d.productType);
      setAnimalId(d.animalId);
      setByproductName(d.byproductName);
      setByproductAnimal(d.byproductAnimal);
      setQuantityKg(d.quantityKg);
      setQuantityCount(d.quantityCount);
      setDirection(d.direction);
      setNotes(d.notes);
    },
  );

  async function onSubmit() {
    const q = Number(quantityKg) || 0;
    const c =
      productType === "BYPRODUCT" ? Math.floor(Number(quantityCount) || 0) : 0;
    if (q < 0 || c < 0 || (q <= 0 && c <= 0)) {
      toast.error(
        productType === "BYPRODUCT"
          ? "Жин (кг) эсвэл тоо (ш) эерэг байх ёстой"
          : "Хэмжээ эерэг тоо",
      );
      return;
    }
    if (productType === "BYPRODUCT" && !byproductName) {
      toast.error("Дайвар сонгоно уу");
      return;
    }
    if (productType === "MEAT" && !animalId) {
      toast.error("Малын төрөл сонгоно уу");
      return;
    }
    if (crossFactory && !factory) {
      toast.error("Дээрх шүүлтүүрээс үйлдвэр сонгоно уу");
      return;
    }
    setBusy(true);
    try {
      const r = await adjust({
        variables: {
          factory: crossFactory ? (factory as never) : null,
          productType: productType as never,
          animalId:
            productType === "MEAT"
              ? animalId
              : (animals.find((a) => a.name === byproductAnimal)?.id ?? null),
          byproductName: productType === "BYPRODUCT" ? byproductName : null,
          quantityKg: q > 0 ? q : null,
          quantityCount: c > 0 ? c : null,
          direction: direction as never,
          notes: notes.trim() || null,
        },
      });
      unwrap(r.data?.adjustInventory);
      clearDraft();
      toast.success("Хадгалагдлаа");
      router.push(
        factory
          ? `/inventory/movements?factory=${factory}`
          : "/inventory/movements",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {crossFactory ? (
            <div className="text-sm sm:col-span-2">
              {factory ? (
                <>
                  Үйлдвэр:{" "}
                  <span className="font-medium">{nameOf(factory)}</span>
                </>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">
                  Дээрх шүүлтүүрээс үйлдвэр сонгоно уу.
                </span>
              )}
            </div>
          ) : null}
          <div>
            <div className="mb-1 text-sm font-medium">Бараа төрөл</div>
            <Select
              value={productType}
              onValueChange={(v) => setProductType(v as "MEAT" | "BYPRODUCT")}
            >
              <SelectTrigger>
                <SelectValue>{PRODUCT_TYPE_MN[productType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEAT">{PRODUCT_TYPE_MN.MEAT}</SelectItem>
                <SelectItem value="BYPRODUCT">
                  {PRODUCT_TYPE_MN.BYPRODUCT}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Бүтээгдэхүүн</div>
            {productType === "MEAT" ? (
              <Select
                value={animalId}
                onValueChange={(v) => setAnimalId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue>
                    {animals.find((a) => a.id === animalId)?.name ?? ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {animals
                    .filter((a) => a.isActive && a.id && a.name)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id as string}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <ByproductNamePicker
                value={byproductName}
                onChange={setByproductName}
                onAnimalChange={setByproductAnimal}
                allowWrapper
              />
            )}
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Чиглэл</div>
            <Select
              value={direction}
              onValueChange={(v) =>
                setDirection(v as "IN" | "OUT" | "ADJUSTMENT")
              }
            >
              <SelectTrigger>
                <SelectValue>{MOVEMENT_TYPE_MN[direction]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">{MOVEMENT_TYPE_MN.IN}</SelectItem>
                <SelectItem value="OUT">{MOVEMENT_TYPE_MN.OUT}</SelectItem>
                <SelectItem value="ADJUSTMENT">
                  {MOVEMENT_TYPE_MN.ADJUSTMENT}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Хэмжээ (кг)</div>
            <Input
              inputMode="decimal"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
            />
          </div>
          {productType === "BYPRODUCT" ? (
            <div>
              <div className="mb-1 text-sm font-medium">Тоо (ш)</div>
              <Input
                inputMode="numeric"
                value={quantityCount}
                onChange={(e) => setQuantityCount(e.target.value)}
              />
            </div>
          ) : null}
        </div>
        <div>
          <div className="mb-1 text-sm font-medium">Тэмдэглэл</div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={busy}>
            {busy ? "..." : "Хадгалах"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
