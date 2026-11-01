"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateFactoryTransferDoc } from "@/lib/queries/factory-transfer";
import { useDraft } from "@/lib/hooks/useDraft";
import { runMutation } from "@/lib/runMutation";

type Item = { id: string; label: string; available: number };

// fromFactory = owner/admin's pick (null for staff — BE uses their own).
export function TransferForm({
  fromFactory,
  items,
}: {
  fromFactory: string | null;
  items: Item[];
}) {
  const router = useRouter();
  const [transfer] = useMutation(CreateFactoryTransferDoc);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  // Emptied after a transfer → back to the starting values, draft dropped.
  useDraft("inventory:transfer", { counts, notes }, (d) => {
    setCounts(d.counts);
    setNotes(d.notes);
  });

  async function onSubmit() {
    const lines = items
      .map((i) => ({
        inventoryItemId: i.id,
        count: Math.floor(Number(counts[i.id]) || 0),
        available: i.available,
      }))
      .filter((l) => l.count > 0);
    if (lines.length === 0) {
      toast.error("Илгээх тоо оруулна уу");
      return;
    }
    if (lines.some((l) => l.count > l.available)) {
      toast.error("Үлдэгдлээс их тоо оруулсан байна");
      return;
    }
    setBusy(true);
    await runMutation(
      async () =>
        (
          await transfer({
            // toFactory omitted → the byproduct site.
            variables: {
              fromFactory,
              lines: lines.map(({ inventoryItemId, count }) => ({
                inventoryItemId,
                quantityKg: 0,
                quantityCount: count,
              })),
              notes: notes.trim() || null,
            },
          })
        ).data?.createFactoryTransfer,
      {
        success: (d) =>
          `${d.transfer?.code ?? "Ачилт"} илгээгдлээ — дайврын үйлдвэр хүлээн авахад нөөцөд нэмэгдэнэ`,
        onSuccess: () => {
          setCounts({});
          setNotes("");
          router.refresh();
        },
      },
    );
    setBusy(false);
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <ul className="divide-y rounded-md border">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{i.label}</div>
                <div className="text-xs text-muted-foreground">
                  Үлдэгдэл: {i.available} ш
                </div>
              </div>
              <Input
                aria-label={`${i.label} илгээх тоо`}
                inputMode="numeric"
                placeholder="0"
                value={counts[i.id] ?? ""}
                onChange={(e) =>
                  setCounts((s) => ({ ...s, [i.id]: e.target.value }))
                }
                className="h-11 w-24 shrink-0 text-center text-lg tabular-nums"
              />
              <span className="w-6 text-sm text-muted-foreground">ш</span>
            </li>
          ))}
        </ul>
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
            {busy ? "..." : "Илгээх"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
