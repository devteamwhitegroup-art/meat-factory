"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AddShipmentSaleEntryDoc,
  DeleteShipmentSaleEntryDoc,
} from "@/lib/queries/shipment";
import { runMutation } from "@/lib/runMutation";
import { PRODUCT_TYPE_MN } from "@/lib/format/enum";
import { formatNumber, formatMNT } from "@/lib/format/money";
import type { SaleLineRow } from "./sale-line-rows";

// ─── Salesman's sales report ─────────────────────────────────────────
//
// Sale lines are server-maintained — one per (productType, animalType /
// byproductName) group across the manifest. After the shipment leaves, the
// salesman reports back what he sold: kg of a group at a price, several
// lines per group if sold in parts (like weighing entries). Income, each
// group's average price and the invoice are recomputed by the server.
// Loaded − sold = хорогдол (meat lost on the way / at the dealer). Shown on
// the shipment page and on its sale (sales/[id]).
function lineLabel(r: SaleLineRow): string {
  if (r.productType === "MEAT") {
    return r.animalType ? r.animalType : PRODUCT_TYPE_MN.MEAT;
  }
  return r.byproductName ?? PRODUCT_TYPE_MN.BYPRODUCT;
}

export function SalesReportPanel({
  saleLines,
  totalPrice,
  canReport,
  onChanged,
}: {
  saleLines: SaleLineRow[];
  totalPrice: number | null;
  // The shipment has left (LOADED / DELIVERED).
  canReport: boolean;
  // Default: re-render the server page.
  onChanged?: () => void;
}) {
  const router = useRouter();
  const changed = onChanged ?? (() => router.refresh());
  const [remove] = useMutation(DeleteShipmentSaleEntryDoc);
  const reported = saleLines.filter((r) => r.soldKg > 0);
  const totalLoss = reported.reduce(
    (s, r) => s + (r.totalWeightKg - r.soldKg),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Борлуулалтын тайлан</CardTitle>
        <p className="text-xs text-muted-foreground">
          {canReport
            ? "Борлуулагчийн мэдээгээр: ямар мах хэдэн кг, ямар үнээр зарагдсан."
            : "Ачилт гарсны дараа борлуулагчийн тайланг энд бүртгэнэ."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {saleLines.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Ачаа нэмэгдсэний дараа барааны мөрүүд автоматаар үүснэ.
          </div>
        ) : (
          saleLines.map((r) => (
            <div key={r.id} className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-medium">{lineLabel(r)}</div>
                <div className="text-sm text-muted-foreground tabular-nums">
                  Ачсан {formatNumber(r.totalWeightKg)} кг · Зарсан{" "}
                  {formatNumber(r.soldKg)} кг ·{" "}
                  {r.soldKg > 0 ? (
                    <>
                      Хорогдол{" "}
                      <span className="text-amber-700 dark:text-amber-400">
                        {formatNumber(r.totalWeightKg - r.soldKg)} кг
                      </span>{" "}
                      ·{" "}
                    </>
                  ) : null}
                  <span className="font-medium text-foreground">
                    {r.amount != null ? formatMNT(r.amount) : "—"}
                  </span>
                </div>
              </div>
              {r.entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1 text-sm tabular-nums"
                >
                  <span>
                    {formatNumber(e.weightKg)} кг × {formatMNT(e.pricePerKg)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{formatMNT(e.amount)}</span>
                    {canReport ? (
                      <button
                        type="button"
                        aria-label="Устгах"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          runMutation(
                            async () =>
                              (await remove({ variables: { id: e.id } })).data
                                ?.deleteShipmentSaleEntry,
                            { onSuccess: changed },
                          )
                        }
                      >
                        <XIcon className="size-4" />
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
              {canReport && r.soldKg < r.totalWeightKg ? (
                <AddEntryRow
                  saleLineId={r.id}
                  remainingKg={r.totalWeightKg - r.soldKg}
                  onAdded={changed}
                />
              ) : null}
            </div>
          ))
        )}

        {reported.length > 0 ? (
          <div className="flex items-center justify-between px-3 text-sm text-muted-foreground">
            <span>Нийт хорогдол</span>
            <span className="tabular-nums">{formatNumber(totalLoss)} кг</span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border-2 border-primary/40 bg-primary/5 px-3 py-2">
          <span className="text-base font-semibold">Нийт борлуулалт</span>
          <span className="text-base font-semibold tabular-nums">
            {totalPrice != null ? formatMNT(totalPrice) : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// One "kg × ₮/kg" line for a group; kg defaults to what's still unsold.
function AddEntryRow({
  saleLineId,
  remainingKg,
  onAdded,
}: {
  saleLineId: string;
  remainingKg: number;
  onAdded: () => void;
}) {
  const [kg, setKg] = useState("");
  const [price, setPrice] = useState("");
  const [add, { loading }] = useMutation(AddShipmentSaleEntryDoc);

  async function onAdd() {
    const w = Number(kg || remainingKg);
    const p = Number(price);
    if (!(w > 0)) return toast.error("Жин 0-ээс их байх ёстой");
    if (!price.trim() || !Number.isFinite(p) || p < 0)
      return toast.error("Үнэ оруулна уу");
    await runMutation(
      async () =>
        (
          await add({
            variables: { saleLineId, weightKg: w, pricePerKg: p },
          })
        ).data?.addShipmentSaleEntry,
      {
        onSuccess: () => {
          setKg("");
          setPrice("");
          onAdded();
        },
      },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={kg}
        onChange={(e) => setKg(e.target.value)}
        placeholder={`${formatNumber(remainingKg)} кг`}
        aria-label="Зарсан кг"
        className="h-9 w-32 tabular-nums"
      />
      <span className="text-sm text-muted-foreground">×</span>
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="₮/кг"
        aria-label="Үнэ ₮/кг"
        className="h-9 w-32 tabular-nums"
      />
      <Button
        size="sm"
        variant="outline"
        className="gap-1"
        disabled={loading}
        onClick={onAdd}
      >
        <PlusIcon className="size-4" />
        Нэмэх
      </Button>
    </div>
  );
}
