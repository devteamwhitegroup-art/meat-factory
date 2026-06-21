"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/registration/StatusBadge";
import {
  SettlementPreview,
  type LineInput,
} from "@/components/registration/SettlementPreview";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import {
  CreateSettlementDoc,
  MarkSettlementPaidDoc,
  RegistrationDetailDoc,
} from "@/lib/queries/registration";
import { AnimalListDoc } from "@/lib/queries/animal";
import { runMutation } from "@/lib/runMutation";
import { formatMNT } from "@/lib/format/money";
import { compact } from "@/lib/compact";
import { SettlementReceipt } from "./_components/SettlementReceipt";

export function SettlementClient({ id }: { id: string }) {
  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(RegistrationDetailDoc, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const [createSettlement] = useMutation(CreateSettlementDoc);
  const [markPaid] = useMutation(MarkSettlementPaidDoc);
  // Admin-configured per-head slaughter cost — pre-fills the line slaughter
  // cost = pricePerAnimal × count.
  const { data: bcData } = useQuery(AnimalListDoc, {
    fetchPolicy: "cache-and-network",
  });

  const reg = data?.registration?.registration;
  const types = useMemo(
    () => compact(reg?.animalLines).map((l) => l.animalType as string),
    [reg],
  );
  const receivedByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const w of compact(reg?.weighingEntries)) {
      m[w.animalType ?? ""] =
        (m[w.animalType ?? ""] ?? 0) + Number(w.weightKg ?? 0);
    }
    return m;
  }, [reg]);
  // Meat income from per-entry negotiated prices.
  const meatByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const w of compact(reg?.weighingEntries)) {
      m[w.animalType ?? ""] =
        (m[w.animalType ?? ""] ?? 0) +
        Number(w.weightKg ?? 0) * Number(w.pricePerKg ?? 0);
    }
    return m;
  }, [reg]);
  const [lines, setLines] = useState<LineInput[]>([]);
  const [notes, setNotes] = useState("");
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  // Per-settlement payout override. Off by default; toggling on prefills
  // from the herder's stored bank info but lets the storekeeper change it
  // for this payout only — doesn't write back to the herder.
  const [overrideBank, setOverrideBank] = useState(false);
  const [payoutBankAccount, setPayoutBankAccount] = useState("");
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountHolderName, setPayoutAccountHolderName] =
    useState("");
  const [busy, setBusy] = useState(false);

  const butcherMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of compact(bcData?.animals?.animals)) {
      if (c.animalType) m[c.animalType] = Number(c.pricePerAnimal ?? 0);
    }
    return m;
  }, [bcData]);
  // Per-animal cover flag — only types where canCover=true are zeroed when
  // the verifier toggles slaughterCoveredByByproduct.
  const coverByType = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const c of compact(bcData?.animals?.animals)) {
      if (c.animalType) m[c.animalType] = !!c.canCoverSlaughterCost;
    }
    return m;
  }, [bcData]);
  const countsByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of compact(reg?.animalLines)) {
      const t = a.animalType ?? "";
      if (t) m[t] = a.count ?? 0;
    }
    return m;
  }, [reg]);

  // Seed the bank override fields from the herder defaults — once when
  // herder data lands, and only if the user hasn't typed anything yet.
  useEffect(() => {
    const h = reg?.herder;
    if (!h) return;
    // Seed bank-override fields from the herder defaults once herder data lands;
    // `v || …` preserves user edits (including a deliberate clear). A legitimate
    // async-data seeding effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPayoutBankAccount((v) => v || h.bankAccount || "");
    setPayoutBankName((v) => v || h.bankName || "");
    setPayoutAccountHolderName(
      (v) => v || h.accountHolderName || h.name || "",
    );
  }, [reg?.herder]);

  // Seed builder lines once: pre-fill slaughterCost = pricePerAnimal × count
  // from the admin Бой зардал config. When the verifier marked the slaughter
  // cost as covered, ONLY animals where canCover=true pre-fill at 0 — others
  // still charge (e.g. cow can't be offset). Storekeeper can still override.
  const covered = !!reg?.verification?.slaughterCoveredByByproduct;
  useEffect(() => {
    if (lines.length > 0) return;
    if (!types.length) return;
    if (reg?.settlement) return;
    if (!bcData) return; // wait for butcher costs to land
    // Seed builder lines once from the admin Бой зардал config (guarded by the
    // lines.length / settlement checks above) — a legitimate async-data seed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(
      types.map((t) => {
        const coverable = !!coverByType[t];
        const cost =
          covered && coverable
            ? 0
            : (butcherMap[t] ?? 0) * (countsByType[t] ?? 0);
        return {
          animalType: t,
          slaughterCost: cost > 0 ? String(cost) : "",
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    types.length,
    bcData,
    reg?.settlement?.id,
    butcherMap,
    coverByType,
    countsByType,
    covered,
  ]);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const existing = reg.settlement;

  async function onCreate() {
    for (const l of lines) {
      if (Number(l.slaughterCost) < 0) {
        toast.error("Бой зардал сөрөг байж болохгүй");
        return;
      }
    }
    setBusy(true);
    await runMutation(
      async () =>
        (
          await createSettlement({
            variables: {
              registrationId: id,
              notes: notes.trim() || null,
              photoFileId: photoFileId ?? null,
              lines: lines.map((l) => ({
                animalType: l.animalType as never,
                slaughterCost: l.slaughterCost ? Number(l.slaughterCost) : 0,
              })),
              // Only send override fields when the storekeeper toggled it on.
              payoutBankAccount: overrideBank
                ? payoutBankAccount.trim() || null
                : null,
              payoutBankName: overrideBank
                ? payoutBankName.trim() || null
                : null,
              payoutAccountHolderName: overrideBank
                ? payoutAccountHolderName.trim() || null
                : null,
            },
          })
        ).data?.createSettlement,
      {
        success: (d) =>
          `Тооцоо үүсгэгдлээ — цэвэр ${formatMNT(d.settlement?.netPayable ?? 0)}`,
        onSuccess: refetch,
      },
    );
    setBusy(false);
  }

  async function onMarkPaid() {
    setBusy(true);
    await runMutation(
      async () =>
        (await markPaid({ variables: { registrationId: id } })).data
          ?.markSettlementPaid,
      { success: "Төлбөр төлсөнд тэмдэглэгдлээ", onSuccess: refetch },
    );
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Бүртгэлийн дугаар</div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              #{reg.registrationNumber}
            </h1>
            <StatusBadge status={reg.status} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Малчин</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-muted-foreground">Нэр</div>
          <div>{reg.herder?.name}</div>
          <div className="text-muted-foreground">Регистр</div>
          <div>{reg.herder?.registrationNo}</div>
          <div className="text-muted-foreground">Утас</div>
          <div>{reg.herder?.phone ?? "—"}</div>
          <div className="text-muted-foreground">Дансны дугаар</div>
          <div>{reg.herder?.bankAccount ?? "—"}</div>
          {reg.herder?.bankName ? (
            <>
              <div className="text-muted-foreground">Банкны нэр</div>
              <div>{reg.herder.bankName}</div>
            </>
          ) : null}
          {reg.herder?.accountHolderName ? (
            <>
              <div className="text-muted-foreground">Эзэмшигчийн нэр</div>
              <div>{reg.herder.accountHolderName}</div>
            </>
          ) : null}
          <div className="text-muted-foreground">Хаяг</div>
          <div>{reg.herder?.address}</div>
        </CardContent>
      </Card>

      {existing ? (
        <SettlementReceipt
          reg={reg}
          existing={existing}
          busy={busy}
          onMarkPaid={onMarkPaid}
        />
      ) : (
        <>
          <SettlementPreview
            receivedByType={receivedByType}
            meatByType={meatByType}
            lines={lines}
          />
          <div className="space-y-3">
            <Textarea
              placeholder="Тэмдэглэл (заавал биш)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            {/* Per-settlement bank override: defaults to herder's stored bank
                info; toggle on when the herder asks money to a different
                account THIS TIME (e.g. cousin's account). Doesn't write back
                to the herder profile. */}
            <div className="rounded-md border bg-muted/20 p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={overrideBank}
                  onChange={(e) => setOverrideBank(e.target.checked)}
                  className="h-4 w-4"
                />
                <span>Бусдын данс руу шилжүүлэх</span>
              </label>
              {overrideBank ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Эзэмшигчийн нэр
                    </label>
                    <Input
                      value={payoutAccountHolderName}
                      onChange={(e) =>
                        setPayoutAccountHolderName(e.target.value)
                      }
                      placeholder={reg.herder?.name ?? ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Банкны нэр
                    </label>
                    <Input
                      value={payoutBankName}
                      onChange={(e) => setPayoutBankName(e.target.value)}
                      placeholder="ж: Хаан банк"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Дансны дугаар
                    </label>
                    <Input
                      value={payoutBankAccount}
                      onChange={(e) =>
                        setPayoutBankAccount(e.target.value)
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Анхдагч: малчны бүртгэлд хадгалсан данс руу шилжих.
                </p>
              )}
            </div>

            <PhotoUpload
              value={photoFileId}
              onChange={setPhotoFileId}
              type="settlement"
              label="Зураг / баримт (заавал биш)"
            />
            <Button
              onClick={onCreate}
              disabled={busy || reg.status !== "VERIFIED"}
              className="w-full"
            >
              {busy ? "..." : "Тооцоо үүсгэх"}
            </Button>
            {reg.status !== "VERIFIED" ? (
              <div className="text-xs text-muted-foreground">
                {'Тооцоо үүсгэхийн тулд статус "Баталгаажсан" байх ёстой.'}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
