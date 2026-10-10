"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { BackButton } from "@/components/common/BackButton";
import { PrintButton } from "@/components/common/PrintButton";
import {
  SettlementPreview,
  type LineInput,
} from "@/components/registration/SettlementPreview";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import {
  CreateSettlementDoc,
  MarkSettlementPaidDoc,
  ReleaseSettlementHoldDoc,
  SetSettlementStorekeeperSignatureDoc,
  RegistrationDetailDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { formatMoney } from "@/lib/format/money";
import { isPreButchered } from "@/lib/format/enum";
import { compact } from "@/lib/compact";
import { SettlementReceipt } from "./_components/SettlementReceipt";
import { PaymentProofGallery } from "./_components/PaymentProofGallery";
import { can } from "@/lib/auth/roles";

function readRoleCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)mf_role=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

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
  const [releaseHold] = useMutation(ReleaseSettlementHoldDoc);
  const [setStorekeeperSignature] = useMutation(
    SetSettlementStorekeeperSignatureDoc,
  );

  // Client-readable role cookie gates the actions. Read post-mount to avoid
  // hydration skew.
  const [role, setRole] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setRole(readRoleCookie()), []);
  const canPay = can(role, "pay");
  const canSign = can(role, "storekeeperSign");

  const reg = data?.registration?.registration;
  // FACTORY_2 (pre-butchered): no verify step, no slaughter cost.
  const pre = isPreButchered(reg?.factory);
  const bundles = useMemo(() => compact(reg?.byproductBundles), [reg]);
  // Дайвар credit per animal = Σ kept гэдэс × price (BE computes the same at
  // createSettlement from the saved bundles).
  const byproductByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of bundles) {
      const t = b.animalType ?? "";
      const k = Number(b.count ?? 0) - Number(b.herderCount ?? 0);
      m[t] = (m[t] ?? 0) + k * Number(b.unitPrice ?? 0);
    }
    return m;
  }, [bundles]);
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
  const [payoutAccountHolderName, setPayoutAccountHolderName] = useState("");
  const [busy, setBusy] = useState(false);

  // Бой зардал is fixed at intake (per-head price × count on animalLines) —
  // display-only; the BE uses the same stored figure.
  const capturedByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of compact(reg?.animalLines)) {
      const t = a.animalType ?? "";
      if (t && a.slaughterCost != null) {
        m[t] = (m[t] ?? 0) + Number(a.slaughterCost);
      }
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
    setPayoutAccountHolderName((v) => v || h.accountHolderName || h.name || "");
  }, [reg?.herder]);

  // Seed builder lines once with the fixed бой зардал. FACTORY_2 has none.
  useEffect(() => {
    if (lines.length > 0) return;
    if (!types.length) return;
    if (reg?.settlement) return;
    // Seed builder lines once (guarded by the lines.length / settlement checks
    // above) — a legitimate async-data seed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(
      types.map((t) => {
        const cost = pre ? 0 : (capturedByType[t] ?? 0);
        return {
          animalType: t,
          slaughterCost: cost > 0 ? String(cost) : "",
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.length, reg?.settlement?.id, capturedByType, pre]);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const existing = reg.settlement;
  const readyStatus = pre ? "WEIGHED" : "VERIFIED";
  // FACTORY_1 must save the herder's гэдэс take first (BE rejects otherwise);
  // unsaved bundles come back with a null id.
  const bundlesUnsaved = !pre && bundles.length > 0 && !bundles[0].id;

  async function onCreate() {
    setBusy(true);
    await runMutation(
      async () =>
        (
          await createSettlement({
            variables: {
              registrationId: id,
              notes: notes.trim() || null,
              photoFileId: photoFileId ?? null,
              lines: lines.map((l) => ({ animalType: l.animalType })),
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
          `Тооцоо үүсгэгдлээ — цэвэр ${formatMoney(d.settlement?.netPayable ?? 0)}`,
        onSuccess: refetch,
      },
    );
    setBusy(false);
  }

  // heldAmount null/0 → pay in full; >0 → partial settlement (the rest is
  // withheld until the medical number is approved, then released).
  async function onMarkPaid(heldAmount: number | null) {
    setBusy(true);
    await runMutation(
      async () =>
        (await markPaid({ variables: { registrationId: id, heldAmount } })).data
          ?.markSettlementPaid,
      {
        success:
          heldAmount && heldAmount > 0
            ? "Хэсэгчлэн төлөгдлөө"
            : "Төлбөр төлсөнд тэмдэглэгдлээ",
        onSuccess: refetch,
      },
    );
    setBusy(false);
  }

  async function onReleaseHold() {
    setBusy(true);
    await runMutation(
      async () =>
        (await releaseHold({ variables: { registrationId: id } })).data
          ?.releaseSettlementHold,
      { success: "Суутгасан дүн олгогдлоо", onSuccess: refetch },
    );
    setBusy(false);
  }

  async function onSetStorekeeperSignature(fileId: string | null) {
    setBusy(true);
    await runMutation(
      async () =>
        (
          await setStorekeeperSignature({
            variables: { registrationId: id, fileId },
          })
        ).data?.setSettlementStorekeeperSignature,
      { success: "Няравын гарын үсэг хадгалагдлаа", onSuccess: refetch },
    );
    setBusy(false);
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
        {existing ? (
          <div className="flex items-center gap-2">
            {existing.id ? (
              <PrintButton type="SETTLEMENT_RECEIPT" id={existing.id} />
            ) : null}
            {existing.isPaid ? (
              <Link href="/registrations" className={buttonVariants()}>
                Бүртгэлийн хэсэг рүү буцах →
              </Link>
            ) : null}
          </div>
        ) : null}
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
        <>
          <SettlementReceipt
            reg={reg}
            existing={existing}
            busy={busy}
            canPay={canPay}
            canSign={canSign}
            onMarkPaid={onMarkPaid}
            onReleaseHold={onReleaseHold}
            onSetStorekeeperSignature={onSetStorekeeperSignature}
          />

          {/* Money-flow statements — appear once a payout has happened. */}
          {Number(existing.paidAmount ?? 0) > 0 ? (
            <PaymentProofGallery
              registrationId={id}
              canAdd={canPay && Number(existing.paidAmount ?? 0) > 0}
              proofs={compact(existing.paymentProofs).map((p) => ({
                id: p.id!,
                sequenceNo: Number(p.sequenceNo ?? 0),
                note: p.note ?? null,
                createdAt: (p.createdAt as string | null) ?? null,
                url: p.file?.url ?? null,
                createdBy: p.createdBy?.param ?? null,
              }))}
              onChanged={refetch}
            />
          ) : null}
        </>
      ) : (
        <>
          <SettlementPreview
            receivedByType={receivedByType}
            meatByType={meatByType}
            byproductByType={byproductByType}
            lines={lines}
          />
          {bundlesUnsaved ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              Малчны авах гэдэс бүртгэгдээгүй байна.{" "}
              <Link
                href={`/registrations/${id}/byproduct`}
                className="font-medium underline"
              >
                Дайвар бүртгэх
              </Link>
            </div>
          ) : null}
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
                      onChange={(e) => setPayoutBankAccount(e.target.value)}
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
              disabled={busy || reg.status !== readyStatus || bundlesUnsaved}
              className="w-full"
            >
              {busy ? "..." : "Тооцоо үүсгэх"}
            </Button>
            {reg.status !== readyStatus ? (
              <div className="text-xs text-muted-foreground">
                {pre
                  ? 'Тооцоо үүсгэхийн тулд статус "Жинлэсэн" байх ёстой.'
                  : 'Тооцоо үүсгэхийн тулд статус "Баталгаажсан" байх ёстой.'}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
