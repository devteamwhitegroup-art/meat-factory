"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SetSalesLineItemPriceDoc } from "@/lib/queries/sales";
import { unwrap } from "@/lib/unwrap";
import { PRODUCT_TYPE_MN } from "@/lib/format/enum";
import { formatMNT, formatNumber } from "@/lib/format/money";

type Line = {
  id: string;
  productType: string | null;
  animalType: string | null;
  byproductName: string | null;
  quantityKg: number;
  unitPrice: number | null;
  lineAmount: number | null;
};

export function LineItemsTable({ lines }: { lines: Line[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Төрөл</TableHead>
          <TableHead>Бүтээгдэхүүн</TableHead>
          <TableHead>Жин</TableHead>
          <TableHead>Үнэ / кг</TableHead>
          <TableHead>Дүн</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((l) => {
          const product =
            l.productType === "MEAT" ? l.animalType : (l.byproductName ?? "—");
          return (
            <TableRow key={l.id}>
              <TableCell>
                {PRODUCT_TYPE_MN[l.productType ?? ""] ?? l.productType}
              </TableCell>
              <TableCell>{product}</TableCell>
              <TableCell>{formatNumber(l.quantityKg)} кг</TableCell>
              <TableCell>
                {l.unitPrice != null ? (
                  formatMNT(l.unitPrice)
                ) : (
                  <PriceInput lineId={l.id} />
                )}
              </TableCell>
              <TableCell>{formatMNT(l.lineAmount)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Inline pricing for a line item that came in null from an auto-created
// (shipment-sourced) invoice — mirrors the shipment's own end-of-load
// pricing input.
function PriceInput({ lineId }: { lineId: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [setPrice] = useMutation(SetSalesLineItemPriceDoc);

  async function onSave() {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Үнэ эерэг тоо байх ёстой");
      return;
    }
    setBusy(true);
    try {
      const r = await setPrice({ variables: { id: lineId, unitPrice: n } });
      unwrap(r.data?.setSalesLineItemPrice);
      toast.success("Үнэ хадгалагдлаа");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Үнэ/кг"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-24 text-right tabular-nums"
      />
      <Button size="sm" onClick={onSave} disabled={busy}>
        {busy ? "..." : "Хадгалах"}
      </Button>
    </div>
  );
}
