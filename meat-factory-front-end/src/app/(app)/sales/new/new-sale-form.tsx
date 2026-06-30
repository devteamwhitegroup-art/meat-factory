"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
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
import { CustomerListDoc } from "@/lib/queries/customer";
import { CreateSalesTransactionDoc } from "@/lib/queries/sales";
import { unwrap } from "@/lib/unwrap";
import { compact } from "@/lib/compact";
import { PRODUCT_TYPE_MN } from "@/lib/format/enum";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { formatMNT } from "@/lib/format/money";
import { ByproductNamePicker } from "@/components/common/ByproductNamePicker";

type LineRow = {
  productType: "MEAT" | "BYPRODUCT";
  animalType: string;
  byproductName: string;
  quantityKg: string;
  unitPrice: string;
};

export function NewSaleForm() {
  const router = useRouter();
  const { animalTypes } = useAnimalCatalog();
  const { data, loading: fetching } = useQuery(CustomerListDoc, {
    variables: {
      isActive: true,
      kind: null,
      limit: 100,
      page: 1,
      search: null,
    },
  });
  const [createSale] = useMutation(CreateSalesTransactionDoc);
  const customers = compact(data?.customers?.customers);

  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineRow[]>([
    {
      productType: "MEAT",
      animalType: "",
      byproductName: "",
      quantityKg: "",
      unitPrice: "",
    },
  ]);
  const [busy, setBusy] = useState(false);

  const totals = useMemo(() => {
    let kg = 0;
    let amt = 0;
    for (const l of lines) {
      const q = Number(l.quantityKg) || 0;
      const p = Number(l.unitPrice) || 0;
      kg += q;
      amt += q * p;
    }
    return { kg, amt };
  }, [lines]);

  function set(i: number, patch: Partial<LineRow>) {
    setLines((s) => s.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addRow() {
    setLines((s) => [
      ...s,
      {
        productType: "MEAT",
        animalType: "",
        byproductName: "",
        quantityKg: "",
        unitPrice: "",
      },
    ]);
  }

  function removeRow(i: number) {
    setLines((s) => (s.length > 1 ? s.filter((_, idx) => idx !== i) : s));
  }

  async function onSubmit() {
    if (!customerId) {
      toast.error("Харилцагч сонгоно уу");
      return;
    }
    if (lines.some((l) => l.productType === "BYPRODUCT" && !l.byproductName)) {
      toast.error("Дайвар сонгоно уу");
      return;
    }
    if (lines.some((l) => l.productType === "MEAT" && !l.animalType)) {
      toast.error("Малын төрөл сонгоно уу");
      return;
    }
    const lineItems = lines.map((l) => {
      const isMeat = l.productType === "MEAT";
      return {
        productType: l.productType as never,
        animalType: isMeat ? l.animalType : null,
        byproductName: !isMeat ? l.byproductName || null : null,
        quantityKg: Number(l.quantityKg) || 0,
        unitPrice: Number(l.unitPrice) || 0,
      };
    });
    for (const li of lineItems) {
      if (li.quantityKg <= 0) {
        toast.error("Жин эерэг тоо байх ёстой");
        return;
      }
      if (li.unitPrice < 0) {
        toast.error("Үнэ сөрөг байж болохгүй");
        return;
      }
    }
    setBusy(true);
    try {
      const r = await createSale({
        variables: {
          customerId,
          transactionDate: date || null,
          notes: notes.trim() || null,
          amount: null,
          lineItems,
        },
      });
      const tx = unwrap(r.data?.createSalesTransaction).salesTransaction;
      if (!tx?.id) throw new Error("Хариу буцаасангүй");
      toast.success(`Гүйлгээ ${tx.transactionCode} үүсгэгдлээ`);
      router.push(`/sales/${tx.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="mb-1 text-sm font-medium">Харилцагч</div>
              <Select
                value={customerId || undefined}
                onValueChange={(v) => setCustomerId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  {/* Explicit text — base-ui Select's auto-match shows the
                      raw value (UUID) when the SelectItem isn't currently
                      mounted, so we resolve the label ourselves. */}
                  {customerId ? (
                    <span>
                      {customers.find((c) => c.id === customerId)?.name ??
                        "Сонгосон"}
                    </span>
                  ) : (
                    <SelectValue
                      placeholder={fetching ? "Уншиж байна…" : "Сонгох"}
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id!} value={c.id!}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-sm font-medium">Огноо</div>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="text-sm font-medium">Бараа</div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2">Төрөл</th>
                <th className="pb-2">Бүтээгдэхүүн</th>
                <th className="pb-2 w-24">Жин (кг)</th>
                <th className="pb-2 w-32">Үнэ / кг</th>
                <th className="pb-2 w-32">Дүн</th>
                <th className="pb-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const amount =
                  (Number(l.quantityKg) || 0) * (Number(l.unitPrice) || 0);
                return (
                  <tr key={i} className="border-t">
                    <td className="py-2">
                      <Select
                        value={l.productType}
                        onValueChange={(raw) => {
                          const v = (raw ?? "MEAT") as "MEAT" | "BYPRODUCT";
                          set(i, {
                            productType: v,
                            animalType: "",
                            byproductName: "",
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <span>
                            {PRODUCT_TYPE_MN[l.productType] ?? l.productType}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEAT">
                            {PRODUCT_TYPE_MN.MEAT}
                          </SelectItem>
                          <SelectItem value="BYPRODUCT">
                            {PRODUCT_TYPE_MN.BYPRODUCT}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2">
                      {l.productType === "MEAT" ? (
                        <Select
                          value={l.animalType || undefined}
                          onValueChange={(v) => set(i, { animalType: v ?? "" })}
                        >
                          <SelectTrigger className="h-8 w-32">
                            {/* Resolve label manually so the trigger always
                                shows the Cyrillic name, even before the
                                catalogue items mount. */}
                            {l.animalType ? (
                              <span>{l.animalType}</span>
                            ) : (
                              <SelectValue placeholder="Сонгох" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {animalTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <ByproductNamePicker
                          value={l.byproductName}
                          onChange={(name) => set(i, { byproductName: name })}
                        />
                      )}
                    </td>
                    <td className="py-2">
                      <Input
                        inputMode="decimal"
                        value={l.quantityKg}
                        onChange={(e) => set(i, { quantityKg: e.target.value })}
                        className="h-8"
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        inputMode="decimal"
                        value={l.unitPrice}
                        onChange={(e) => set(i, { unitPrice: e.target.value })}
                        className="h-8"
                      />
                    </td>
                    <td className="py-2">{formatMNT(amount)}</td>
                    <td className="py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRow(i)}
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={addRow}>
              + Мөр нэмэх
            </Button>
            <div className="text-sm">
              Нийт: <b>{totals.kg}</b> кг · <b>{formatMNT(totals.amt)}</b>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={busy}>
          {busy ? "..." : "Үүсгэх"}
        </Button>
      </div>
    </div>
  );
}
