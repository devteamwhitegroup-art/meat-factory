"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequestRegistrationChangeDoc } from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { useDraft } from "@/lib/hooks/useDraft";

type Entry = {
  id: string;
  sequenceNo: number | null;
  animalType: string | null;
  weightKg: number;
  pricePerKg: number | null;
};
type Row = { weight: string; price: string };
type NewRow = Row & { animalType: string };

const priceOf = (s: string) => (s.trim() === "" ? null : Number(s));

// Finished weighing is admin-locked: staff propose weight / price fixes and
// extra entries here; admin applies them on approval.
export function WeighingForm({
  id,
  entries,
  animalTypes,
}: {
  id: string;
  entries: Entry[];
  // The registration's animal lines — a new entry must be one of them.
  animalTypes: string[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      entries.map((e) => [
        e.id,
        { weight: String(e.weightKg), price: String(e.pricePerKg ?? "") },
      ]),
    ),
  );
  const [added, setAdded] = useState<NewRow[]>([]);
  const [reason, setReason] = useState("");
  const [request, { loading }] = useMutation(RequestRegistrationChangeDoc);
  const clearDraft = useDraft(
    `reg-weigh-req:${id}`,
    { rows, added, reason },
    (d) => {
      setRows(d.rows);
      setAdded(d.added);
      setReason(d.reason);
    },
  );

  const setRow = (entryId: string, patch: Partial<Row>) =>
    setRows({ ...rows, [entryId]: { ...rows[entryId], ...patch } });
  const setNew = (i: number, patch: Partial<NewRow>) =>
    setAdded(added.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Only entries whose weight or price actually changed.
    const weights = entries
      .map((en) => ({
        entryId: en.id,
        weightKg: Number(rows[en.id].weight),
        pricePerKg: priceOf(rows[en.id].price),
      }))
      .filter(
        (w, k) =>
          w.weightKg !== entries[k].weightKg ||
          w.pricePerKg !== entries[k].pricePerKg,
      );
    const newOnes = added.map((a) => ({
      animalType: a.animalType,
      weightKg: Number(a.weight),
      pricePerKg: priceOf(a.price),
    }));
    const all = [...weights, ...newOnes];
    if (all.length === 0) return toast.error("Өөрчлөлт алга");
    if (all.some((w) => !(w.weightKg > 0)))
      return toast.error("Жин 0-ээс их байх ёстой");
    if (all.some((w) => w.pricePerKg != null && !(w.pricePerKg >= 0)))
      return toast.error("Үнэ буруу байна");
    if (!reason.trim()) return toast.error("Засварын шалтгаан бичнэ үү");

    await runMutation(
      async () =>
        (
          await request({
            variables: {
              registrationId: id,
              reason: reason.trim(),
              weights,
              added: newOnes,
            },
          })
        ).data?.requestRegistrationChange,
      {
        success: "Хүсэлт админд илгээгдлээ",
        onSuccess: () => {
          clearDraft();
          router.push(`/registrations/${id}`);
          router.refresh();
        },
      },
    );
  }

  const numberInput = (value: string, onChange: (v: string) => void) => (
    <Input
      type="number"
      inputMode="decimal"
      step="0.01"
      min="0"
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
      className="h-10 tabular-nums"
    />
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="grid grid-cols-[7rem_1fr_1fr_2rem] items-center gap-2 text-xs text-muted-foreground">
            <span />
            <span>Жин (кг)</span>
            <span>Үнэ (₮/кг)</span>
            <span />
          </div>
          {entries.map((en) => (
            <div
              key={en.id}
              className="grid grid-cols-[7rem_1fr_1fr_2rem] items-center gap-2"
            >
              <Label className="text-sm">
                #{en.sequenceNo} {en.animalType}
              </Label>
              {numberInput(rows[en.id].weight, (v) =>
                setRow(en.id, { weight: v }),
              )}
              {numberInput(rows[en.id].price, (v) =>
                setRow(en.id, { price: v }),
              )}
              <span />
            </div>
          ))}
          {added.map((a, i) => (
            <div
              key={i}
              className="grid grid-cols-[7rem_1fr_1fr_2rem] items-center gap-2"
            >
              <select
                value={a.animalType}
                onChange={(ev) => setNew(i, { animalType: ev.target.value })}
                className="h-11 rounded-lg border border-input bg-card px-3 text-base"
              >
                {animalTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {numberInput(a.weight, (v) => setNew(i, { weight: v }))}
              {numberInput(a.price, (v) => setNew(i, { price: v }))}
              <button
                type="button"
                aria-label="Хасах"
                onClick={() => setAdded(added.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="gap-1"
            disabled={animalTypes.length === 0}
            onClick={() =>
              setAdded([
                ...added,
                { animalType: animalTypes[0], weight: "", price: "" },
              ])
            }
          >
            <PlusIcon className="size-4" />
            Жин нэмэх
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <Label className="text-base">Засварын шалтгаан</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Засах болсон шалтгаан"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-lg"
        disabled={loading}
      >
        Хүсэлт илгээх
      </Button>
    </form>
  );
}
