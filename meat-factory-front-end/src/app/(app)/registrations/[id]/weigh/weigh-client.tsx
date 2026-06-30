"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { NumericKeypad } from "@/components/forms/NumericKeypad";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { BackButton } from "@/components/common/BackButton";
import { formatNumber } from "@/lib/format/money";
import {
  AddWeighingEntryDoc,
  DeleteWeighingEntryDoc,
  FinishWeighingDoc,
  RegistrationDetailDoc,
  UpdateWeighingEntryDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { WeighEntryDialog } from "./_components/WeighEntryDialog";
import { WeighingHistoryList } from "./_components/WeighingHistoryList";
import { SlaughterCostEditor } from "./_components/SlaughterCostEditor";

function readRole(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)mf_role=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Mirrors the back-end rule: while weighing is in progress (REGISTERED) the
// scale operator may edit; once "fully uploaded" (WEIGHED / VERIFIED /
// PAYMENT_PENDING) only manager/admin may; after SETTLED/CANCELLED nobody may.
function canEditEntries(status: string, role: string | null): boolean {
  if (status === "SETTLED" || status === "CANCELLED") return false;
  const privileged =
    role === "MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN";
  if (
    status === "WEIGHED" ||
    status === "VERIFIED" ||
    status === "PAYMENT_PENDING"
  )
    return privileged;
  // Open-window weigh edits: anyone on the floor except the gate guard.
  return (
    privileged ||
    role === "SCALE" ||
    role === "STOREKEEPER" ||
    role === "MODERATOR"
  );
}

export function WeighClient({ id }: { id: string }) {
  const router = useRouter();
  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(RegistrationDetailDoc, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const [addWeighing] = useMutation(AddWeighingEntryDoc);
  const [finishWeighing] = useMutation(FinishWeighingDoc);
  const [updateWeighing] = useMutation(UpdateWeighingEntryDoc);
  const [deleteWeighing] = useMutation(DeleteWeighingEntryDoc);

  const [role, setRole] = useState<string | null>(null);
  // role comes from a client-only cookie; defer to post-mount to avoid an
  // SSR/client hydration mismatch (documented client-only-after-mount pattern).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setRole(readRole()), []);

  const [editing, setEditing] = useState<{ id: string; seq: number } | null>(
    null,
  );
  const [editWeight, setEditWeight] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const reg = data?.registration?.registration;
  const types = useMemo(
    () => compact(reg?.animalLines).map((l) => l.animalType as string),
    [reg],
  );
  const [tab, setTab] = useState<string | null>(null);
  const activeTab = tab ?? types[0] ?? null;
  const [keypad, setKeypad] = useState("");
  // Last-entered price is remembered across entries of the same animal type
  // (operator doesn't re-type it for each animal). It's cleared when the active
  // tab changes (see the Tabs onValueChange) — each type is its own negotiation.
  const [price, setPrice] = useState("");
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (fetching && !reg) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!reg) {
    return <div className="text-muted-foreground">Бүртгэл олдсонгүй.</div>;
  }

  async function submitWeight() {
    if (!activeTab) return;
    const w = Number(keypad);
    if (!w || w <= 0) return;
    const p = Number(price);
    if (!p || p <= 0) {
      toast.error("Үнэ/кг оруулна уу");
      return;
    }
    setBusy(true);
    await runMutation(
      async () =>
        (
          await addWeighing({
            variables: {
              registrationId: id,
              animalType: activeTab,
              weightKg: w,
              pricePerKg: p,
              photoFileId: photoFileId ?? null,
            },
          })
        ).data?.addWeighingEntry,
      {
        success: `${formatNumber(w)} кг · ${formatNumber(p)}₮/кг`,
        onSuccess: () => {
          setKeypad("");
          // Keep `price` — same animal type usually shares the negotiated rate.
          setPhotoFileId(null);
          refetch();
        },
      },
    );
    setBusy(false);
  }

  async function finish() {
    setBusy(true);
    await runMutation(
      async () =>
        (await finishWeighing({ variables: { registrationId: id } })).data
          ?.finishWeighing,
      {
        success: "Жин бүртгэл дууссан",
        onSuccess: () => {
          router.push(`/registrations/${id}`);
          router.refresh();
        },
      },
    );
    setBusy(false);
  }

  async function saveEdit() {
    if (!editing) return;
    const entryId = editing.id;
    const w = Number(editWeight);
    if (!w || w <= 0) {
      toast.error("Жин 0-ээс их байх ёстой");
      return;
    }
    const p = editPrice.trim() ? Number(editPrice) : null;
    if (p != null && p <= 0) {
      toast.error("Үнэ 0-ээс их байх ёстой");
      return;
    }
    setBusy(true);
    await runMutation(
      async () =>
        (
          await updateWeighing({
            variables: { id: entryId, weightKg: w, pricePerKg: p },
          })
        ).data?.updateWeighingEntry,
      {
        success: "Жин засагдлаа",
        onSuccess: () => {
          setEditing(null);
          refetch();
        },
      },
    );
    setBusy(false);
  }

  async function removeEntry(entryId: string, seq: number) {
    if (!window.confirm(`#${seq} бичлэгийг устгах уу?`)) return;
    setBusy(true);
    await runMutation(
      async () =>
        (await deleteWeighing({ variables: { id: entryId } })).data
          ?.deleteWeighingEntry,
      { success: "Бичлэг устгагдлаа", onSuccess: refetch },
    );
    setBusy(false);
  }

  type W = ReturnType<
    typeof compact<NonNullable<NonNullable<typeof reg.weighingEntries>[number]>>
  >[number];
  const entriesByType: Record<string, W[]> = {};
  for (const w of compact(reg.weighingEntries)) {
    const t = w.animalType ?? "";
    if (!entriesByType[t]) entriesByType[t] = [];
    entriesByType[t].push(w);
  }

  const editable = canEditEntries(reg.status ?? "", role);

  // Display numbering restarts at 1 per animal type (capture order), so it
  // stays contiguous even after a middle entry is removed.
  const displayNoById: Record<string, number> = {};
  for (const list of Object.values(entriesByType)) {
    [...list]
      .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
      .forEach((w, i) => {
        if (w.id) displayNoById[w.id] = i + 1;
      });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <BackButton href={`/registrations/${id}`} />
          <div>
            <div className="text-sm text-muted-foreground">Бүртгэлийн код</div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold">
                {reg.registrationCode ?? "—"}
              </h1>
              <StatusBadge status={reg.status} />
            </div>
          </div>
        </div>
        {/* Finish only makes sense while still in REGISTERED with at least
            one entry recorded — afterwards the status is WEIGHED or beyond. */}
        <Button
          onClick={finish}
          disabled={
            busy ||
            reg.status !== "REGISTERED" ||
            compact(reg.weighingEntries).length === 0
          }
        >
          Жинг бүртгэж дуусгах
        </Button>
      </div>

      <Tabs
        value={activeTab ?? ""}
        onValueChange={(v) => {
          setTab(v);
          setPrice("");
        }}
      >
        <TabsList>
          {types.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        {types.map((t) => (
          <TabsContent key={t} value={t}>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Жин бүртгэл — {t}</CardTitle>
                </CardHeader>
                <CardContent>
                  <NumericKeypad
                    value={keypad}
                    onChange={setKeypad}
                    onSubmit={submitWeight}
                    disabled={busy || reg.status !== "REGISTERED"}
                  />
                  <div className="mt-3 space-y-1.5">
                    <label className="text-sm font-medium">
                      Үнэ / кг (₮, хэлэлцсэн)
                    </label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="ж: 30000"
                      className="h-12 text-lg"
                      disabled={busy || reg.status !== "REGISTERED"}
                    />
                  </div>
                  <div className="mt-4">
                    <PhotoUpload
                      value={photoFileId}
                      onChange={setPhotoFileId}
                      type="scale"
                      label="Зураг (заавал биш)"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Түүх</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeighingHistoryList
                    entries={entriesByType[t] ?? []}
                    displayNoById={displayNoById}
                    editable={editable}
                    busy={busy}
                    onEdit={(w, seq) => {
                      setEditing({ id: w.id!, seq });
                      setEditWeight(String(w.weightKg ?? ""));
                      setEditPrice(
                        w.pricePerKg != null ? String(w.pricePerKg) : "",
                      );
                    }}
                    onRemove={removeEntry}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <SlaughterCostEditor
        registrationId={id}
        editable={reg.status === "REGISTERED" || reg.status === "WEIGHED"}
        lines={compact(reg.animalLines).map((l) => ({
          animalType: l.animalType ?? "",
          count: l.count ?? 0,
          slaughterCost:
            l.slaughterCost != null ? Number(l.slaughterCost) : null,
        }))}
        onChanged={refetch}
      />

      <WeighEntryDialog
        open={editing !== null}
        seq={editing?.seq}
        weight={editWeight}
        price={editPrice}
        onWeightChange={setEditWeight}
        onPriceChange={setEditPrice}
        onSave={saveEdit}
        onClose={() => setEditing(null)}
        busy={busy}
      />
    </div>
  );
}
