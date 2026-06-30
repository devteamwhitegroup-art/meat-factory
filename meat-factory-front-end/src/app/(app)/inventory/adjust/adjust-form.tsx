"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function AdjustForm() {
  const router = useRouter();
  const { animalTypes, animalName } = useAnimalCatalog();
  const [adjust] = useMutation(AdjustInventoryDoc);
  const [productType, setProductType] = useState<"MEAT" | "BYPRODUCT">("MEAT");
  const [animalType, setAnimalType] = useState("COW");
  const [byproductName, setByproductName] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [direction, setDirection] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    const q = Number(quantityKg);
    if (!q || q <= 0) {
      toast.error("Хэмжээ эерэг тоо");
      return;
    }
    if (productType === "BYPRODUCT" && !byproductName) {
      toast.error("Дайвар сонгоно уу");
      return;
    }
    setBusy(true);
    try {
      const r = await adjust({
        variables: {
          productType: productType as never,
          animalType: productType === "MEAT" ? (animalType as never) : null,
          byproductName: productType === "BYPRODUCT" ? byproductName : null,
          quantityKg: q,
          direction: direction as never,
          notes: notes.trim() || null,
        },
      });
      unwrap(r.data?.adjustInventory);
      toast.success("Хадгалагдлаа");
      router.push("/inventory/movements");
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
                value={animalType}
                onValueChange={(v) => setAnimalType(v ?? "COW")}
              >
                <SelectTrigger>
                  <SelectValue>
                    {animalName.get(animalType) ?? animalType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {animalTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {animalName.get(t) ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <ByproductNamePicker
                value={byproductName}
                onChange={setByproductName}
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
