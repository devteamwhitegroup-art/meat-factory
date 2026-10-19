"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { RegistrationTitle } from "../_components/RegistrationTitle";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { NumericKeypad } from "@/components/forms/NumericKeypad";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import {
  formatDecimalInput,
  formatNumber,
  sanitizeDecimalInput,
} from "@/lib/format/money";
import {
  AddWeighingEntryDoc,
  DeleteWeighingEntryDoc,
  FinishWeighingDoc,
  RegistrationDetailDoc,
  SetRegistrationByproductsDoc,
  UpdateWeighingEntryDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { useDraft } from "@/lib/hooks/useDraft";
import { compact } from "@/lib/compact";
import { useFactories } from "@/lib/factory/FactoriesProvider";
import { WeighEntryDialog } from "./_components/WeighEntryDialog";
import { WeighingHistoryList } from "./_components/WeighingHistoryList";
import { SlaughterCostSummary } from "./_components/SlaughterCostSummary";
import { WeighingAuditLog } from "./_components/WeighingAuditLog";
import {
  ByproductIntakeEditor,
  intakeInputs,
  type IntakeEdits,
} from "./_components/ByproductIntakeEditor";
import { can, readPermsCookie } from "@/lib/auth/roles";

// Mirrors the back-end rule (WeighingController._assertWeighingEditable):
// while weighing is in progress (REGISTERED) the scale operator may
// add/edit/remove; once "fully uploaded" (WEIGHED / VERIFIED /
// PAYMENT_PENDING — a Settlement may already exist, just not paid yet) only
// manager/admin may, and it's logged; once money has actually moved
// (SETTLED / PARTIALLY_SETTLED) or the registration is CANCELLED, nobody may.
function canEditEntries(status: string, perms: string[] | null): boolean {
  if (
    status === "SETTLED" ||
    status === "PARTIALLY_SETTLED" ||
    status === "CANCELLED"
  )
    return false;
  if (
    status === "WEIGHED" ||
    status === "VERIFIED" ||
    status === "PAYMENT_PENDING"
  )
    return can(perms, "REGISTRATION_WEIGH_FIX");
  return can(perms, "REGISTRATION_WEIGH");
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
  const [saveByproducts] = useMutation(SetRegistrationByproductsDoc);
  // Хойд: byproduct count/price edits, keyed by constantId (unedited rows
  // keep the BE value).
  const [intake, setIntake] = useState<IntakeEdits>({});

  const [perms, setPerms] = useState<string[] | null>(null);
  // permissions come from a client-only cookie; defer to post-mount to avoid
  // an SSR/client hydration mismatch (client-only-after-mount pattern).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setPerms(readPermsCookie()), []);
  const { isPreButchered } = useFactories();

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
  // In-progress entry + unsaved byproduct edits survive leaving the page (saved
  // weighings are already on the server).
  const clearDraft = useDraft(
    `weigh:${id}`,
    { intake, tab, keypad, price, photoFileId },
    (d) => {
      setIntake(d.intake ?? {});
      setTab(d.tab);
      setKeypad(d.keypad);
      setPrice(d.price);
      setPhotoFileId(d.photoFileId);
    },
  );

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
  // FACTORY_2: no бой зардал; гэдэс counted here, stocked at finish.
  const pre = isPreButchered(reg.factory);

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

  // Хойд: persist edited byproduct counts / prices.
  async function saveIntake(): Promise<boolean> {
    const bundles = intakeInputs(compact(reg?.byproductBundles), intake);
    return runMutation(
      async () =>
        (await saveByproducts({ variables: { registrationId: id, bundles } }))
          .data?.setRegistrationByproducts,
      {
        success: "Дайвар хадгалагдлаа",
        onSuccess: async () => {
          setIntake({});
          await refetch();
        },
      },
    );
  }

  async function finish() {
    setBusy(true);
    // Хойд stocks meat + byproducts at finish — save pending edits first
    // (untouched rows fall back to the BE defaults).
    if (pre && Object.keys(intake).length > 0 && !(await saveIntake())) {
      setBusy(false);
      return;
    }
    await runMutation(
      async () =>
        (await finishWeighing({ variables: { registrationId: id } })).data
          ?.finishWeighing,
      {
        success: "Жин бүртгэл дууссан",
        onSuccess: () => {
          clearDraft();
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

  const editable = canEditEntries(reg.status ?? "", perms);

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
        <RegistrationTitle
          id={id}
          code={reg.registrationCode}
          status={reg.status}
        />
        {/* Finish (the REGISTERED → WEIGHED transition) only makes sense
            while still REGISTERED. Afterwards the registration is already
            WEIGHED or beyond — this page is also reachable then, via "Жин
            засах" on the registration page, to fix a mistake — so there's
            no status left to move to. Swap in a plain "Done" nav (no
            mutation) so there's always an obvious button to click, without
            risking the invalid-transition error finish() would throw. */}
        {reg.status === "REGISTERED" ? (
          <Button
            onClick={finish}
            disabled={busy || compact(reg.weighingEntries).length === 0}
          >
            Жинг бүртгэж дуусгах
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => router.push(`/registrations/${id}`)}
          >
            Дуусгах
          </Button>
        )}
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
                    disabled={busy || !editable}
                  />
                  <div className="mt-3 space-y-1.5">
                    <label className="text-sm font-medium">
                      Үнэ / кг (₮, хэлэлцсэн)
                    </label>
                    <Input
                      inputMode="decimal"
                      value={formatDecimalInput(price)}
                      onChange={(e) =>
                        setPrice(sanitizeDecimalInput(e.target.value))
                      }
                      placeholder="ж: 30,000"
                      className="h-12 text-lg"
                      disabled={busy || !editable}
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

      {pre ? (
        <ByproductIntakeEditor
          bundles={compact(reg.byproductBundles)}
          edits={intake}
          editable={reg.status === "REGISTERED" && editable}
          busy={busy}
          onChange={setIntake}
          onSave={async () => {
            setBusy(true);
            await saveIntake();
            setBusy(false);
          }}
        />
      ) : (
        <SlaughterCostSummary
          lines={compact(reg.animalLines).map((l) => ({
            animalType: l.animalType ?? "",
            count: l.count ?? 0,
            slaughterCost:
              l.slaughterCost != null ? Number(l.slaughterCost) : null,
          }))}
        />
      )}

      <WeighingAuditLog
        rows={compact(reg.weighingAuditLog).map((a) => ({
          id: a.id!,
          action: a.action ?? null,
          weightKgBefore:
            a.weightKgBefore != null ? Number(a.weightKgBefore) : null,
          weightKgAfter:
            a.weightKgAfter != null ? Number(a.weightKgAfter) : null,
          pricePerKgBefore:
            a.pricePerKgBefore != null ? Number(a.pricePerKgBefore) : null,
          pricePerKgAfter:
            a.pricePerKgAfter != null ? Number(a.pricePerKgAfter) : null,
          createdAt: a.createdAt as string | null,
          actor: a.actor?.param ?? null,
        }))}
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
