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
import { CreateFactoryTransferDoc } from "@/lib/queries/factory-transfer";
import { formatNumber } from "@/lib/format/money";
import { runMutation } from "@/lib/runMutation";

type Item = { id: string; label: string; kg: number; count: number };
type Qty = { kg?: string; count?: string };

// Pick quantities from the sender's stock rows (kg and/or pieces, whichever
// the row holds) and the receiving factory.
export function TransferSendForm({
  fromFactory,
  destinations,
  items,
}: {
  fromFactory: string;
  destinations: { code: string; name: string }[];
  items: Item[];
}) {
  const router = useRouter();
  const [create] = useMutation(CreateFactoryTransferDoc);
  const [to, setTo] = useState("");
  const [qty, setQty] = useState<Record<string, Qty>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (id: string, patch: Qty) =>
    setQty((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  async function onSubmit() {
    const target = destinations.find((d) => d.code === to);
    if (!target) return void toast.error("Хүлээн авах үйлдвэр сонгоно уу");
    const lines = items
      .map((i) => ({
        item: i,
        quantityKg: Number(qty[i.id]?.kg) || 0,
        quantityCount: Math.floor(Number(qty[i.id]?.count) || 0),
      }))
      .filter((l) => l.quantityKg > 0 || l.quantityCount > 0);
    if (lines.length === 0) return void toast.error("Илгээх хэмжээ оруулна уу");
    const over = lines.find(
      (l) => l.quantityKg > l.item.kg || l.quantityCount > l.item.count,
    );
    if (over)
      return void toast.error(`${over.item.label}: үлдэгдлээс их байна`);
    if (!confirm(`${target.name} рүү илгээх үү? Таны нөөцөөс хасагдана.`))
      return;

    setBusy(true);
    await runMutation(
      async () =>
        (
          await create({
            variables: {
              fromFactory,
              toFactory: target.code,
              lines: lines.map((l) => ({
                inventoryItemId: l.item.id,
                quantityKg: l.quantityKg,
                quantityCount: l.quantityCount,
              })),
              notes: notes.trim() || null,
            },
          })
        ).data?.createFactoryTransfer,
      {
        success: (d) => `${d.transfer?.code ?? ""} илгээлээ`,
        onSuccess: () => router.push("/shipments/transfers"),
      },
    );
    setBusy(false);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1.5">
          <div className="text-sm font-medium">Хүлээн авах үйлдвэр</div>
          <Select value={to || null} onValueChange={(v) => setTo(v ?? "")}>
            <SelectTrigger className="h-11 w-full sm:w-72">
              <SelectValue placeholder="Сонгох">
                {destinations.find((d) => d.code === to)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {destinations.map((d) => (
                <SelectItem key={d.code} value={d.code}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ul className="divide-y rounded-md border">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-center gap-3 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{i.label}</div>
                <div className="text-xs text-muted-foreground">
                  Үлдэгдэл:{" "}
                  {[
                    i.count > 0 ? `${i.count} ш` : null,
                    i.kg > 0 ? `${formatNumber(i.kg)} кг` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              {i.count > 0 ? (
                <div className="flex items-center gap-1">
                  <Input
                    aria-label={`${i.label} тоо`}
                    inputMode="numeric"
                    placeholder="0"
                    value={qty[i.id]?.count ?? ""}
                    onChange={(e) =>
                      set(i.id, { count: e.target.value.replace(/\D/g, "") })
                    }
                    className="h-11 w-24 text-center text-lg tabular-nums"
                  />
                  <span className="w-6 text-sm text-muted-foreground">ш</span>
                </div>
              ) : null}
              {i.kg > 0 ? (
                <div className="flex items-center gap-1">
                  <Input
                    aria-label={`${i.label} жин`}
                    inputMode="decimal"
                    placeholder="0"
                    value={qty[i.id]?.kg ?? ""}
                    onChange={(e) =>
                      set(i.id, { kg: e.target.value.replace(/[^\d.]/g, "") })
                    }
                    className="h-11 w-28 text-center text-lg tabular-nums"
                  />
                  <span className="w-6 text-sm text-muted-foreground">кг</span>
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div>
          <div className="mb-1 text-sm font-medium">Тэмдэглэл</div>
          <Textarea
            placeholder="Машин, жолооч г.м."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={busy}>
            {busy ? "..." : "Илгээх"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
