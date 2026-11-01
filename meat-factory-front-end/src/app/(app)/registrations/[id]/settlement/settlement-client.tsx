"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";

import { Button, buttonVariants } from "@/components/ui/button";
import { RegistrationTitle } from "../_components/RegistrationTitle";
import { HerderInfoCard } from "../_components/HerderInfoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrintButton } from "@/components/common/PrintButton";
import { SettlementBreakdown } from "@/components/registration/SettlementBreakdown";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import {
  CreateSettlementDoc,
  MarkSettlementPaidDoc,
  ReleaseSettlementHoldDoc,
  SetSettlementStorekeeperSignatureDoc,
  IssueSettlementEbarimtDoc,
  VoidSettlementEbarimtDoc,
  RegistrationDetailDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { formatMoney } from "@/lib/format/money";
import { compact } from "@/lib/compact";
import { SettlementReceipt } from "./_components/SettlementReceipt";
import { PaymentProofGallery } from "./_components/PaymentProofGallery";
import { EbarimtCard } from "./_components/EbarimtCard";
import { EBARIMT_POSAPI } from "@/lib/ebarimt";

export function SettlementClient({
  id,
  canPay,
  canSales,
}: {
  id: string;
  // SETTLEMENT_PAY: pay, sign, attach proofs (from the server session).
  canPay: boolean;
  canSales: boolean;
}) {
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
  const [issueEbarimt] = useMutation(IssueSettlementEbarimtDoc);
  const [voidEbarimt] = useMutation(VoidSettlementEbarimtDoc);

  const reg = data?.registration?.registration;
  const [notes, setNotes] = useState("");
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  // Per-settlement payout override. Off by default; turning it on prefills
  // the herder's stored bank info, editable for this payout only — doesn't
  // write back to the herder.
  const [overrideBank, setOverrideBank] = useState(false);
  const [payoutBankAccount, setPayoutBankAccount] = useState("");
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountHolderName, setPayoutAccountHolderName] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleOverride(on: boolean) {
    setOverrideBank(on);
    const h = reg?.herder;
    if (!on || !h) return;
    setPayoutBankAccount((v) => v || h.bankAccount || "");
    setPayoutBankName((v) => v || h.bankName || "");
    setPayoutAccountHolderName((v) => v || h.accountHolderName || h.name || "");
  }

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const existing = reg.settlement;
  const preview = reg.settlementPreview;
  // Live intake: the herder's гэдэс take must be recorded first.
  const byproductsPending = !!preview?.byproductsPending;

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

  async function onIssueEbarimt() {
    setBusy(true);
    await runMutation(
      async () =>
        (await issueEbarimt({ variables: { registrationId: id } })).data
          ?.issueSettlementEbarimt,
      {
        success: (d) =>
          `И-Баримт үүслээ — ДДТД ${d.settlement?.ebarimtId ?? ""}`,
        onSuccess: refetch,
      },
    );
    setBusy(false);
  }

  async function onVoidEbarimt() {
    setBusy(true);
    await runMutation(
      async () =>
        (await voidEbarimt({ variables: { registrationId: id } })).data
          ?.voidSettlementEbarimt,
      { success: "И-Баримт цуцлагдлаа", onSuccess: refetch },
    );
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RegistrationTitle
          id={id}
          code={reg.registrationCode}
          status={reg.status}
        />
        {existing ? (
          <div className="flex items-center gap-2">
            {existing.id ? (
              <PrintButton type="SETTLEMENT_RECEIPT" id={existing.id} />
            ) : null}
            {/* After payout: back to the herder payout list (Гүйлгээ →
                Малчид) for those who can open it; нярав → Бүртгэл. */}
            {existing.isPaid ? (
              canSales ? (
                <Link href="/sales?tab=herders" className={buttonVariants()}>
                  Малчдын төлбөр рүү буцах →
                </Link>
              ) : (
                <Link href="/registrations" className={buttonVariants()}>
                  Бүртгэлийн хэсэг рүү буцах →
                </Link>
              )
            ) : null}
          </div>
        ) : null}
      </div>

      <HerderInfoCard
        herder={reg.herder?.id ? { ...reg.herder, id: reg.herder.id } : null}
        canEdit={false}
      />

      {existing ? (
        <>
          <SettlementReceipt
            reg={reg}
            existing={existing}
            busy={busy}
            canPay={canPay}
            canSign={canPay}
            onMarkPaid={onMarkPaid}
            onReleaseHold={onReleaseHold}
            onSetStorekeeperSignature={onSetStorekeeperSignature}
          />

          {/* PosAPI issue/void — parked, see EBARIMT_POSAPI. The manual
              eBarimt check is on the verify page. */}
          {EBARIMT_POSAPI ? (
            <EbarimtCard
              ebarimtId={existing.ebarimtId ?? null}
              ebarimtDate={existing.ebarimtDate ?? null}
              ebarimtIssuedAt={existing.ebarimtIssuedAt ?? null}
              ebarimtVoidedAt={existing.ebarimtVoidedAt ?? null}
              ebarimtError={existing.ebarimtError ?? null}
              herderTin={reg.herder?.tin ?? null}
              canPay={canPay}
              busy={busy}
              onIssue={onIssueEbarimt}
              onVoid={onVoidEbarimt}
            />
          ) : null}

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
          {preview ? (
            <Card>
              <CardHeader>
                <CardTitle>Тооцоо</CardTitle>
              </CardHeader>
              <CardContent>
                <SettlementBreakdown s={preview} />
              </CardContent>
            </Card>
          ) : null}
          {byproductsPending ? (
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
            <div
              className={
                "rounded-md border transition-colors " +
                (overrideBank ? "border-primary bg-primary/5" : "bg-muted/20")
              }
            >
              {/* Whole header row toggles, not just the checkbox. */}
              <label className="flex cursor-pointer select-none items-center gap-3 rounded-md p-3 text-sm font-medium hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={overrideBank}
                  onChange={(e) => toggleOverride(e.target.checked)}
                  className="h-5 w-5 cursor-pointer"
                />
                <span className="flex-1">
                  Бусдын данс руу шилжүүлэх
                  <span className="block text-xs font-normal text-muted-foreground">
                    Зөвхөн энэ тооцоонд хамаарна — малчны үндсэн данс
                    өөрчлөгдөхгүй.
                  </span>
                </span>
              </label>
              {overrideBank ? (
                <div className="grid gap-2 px-3 pb-3 sm:grid-cols-3">
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
                <p className="px-3 text-xs text-muted-foreground"></p>
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
              disabled={busy || !reg.can?.createSettlement || byproductsPending}
              className="w-full"
            >
              {busy ? "..." : "Тооцоо үүсгэх"}
            </Button>
            {!reg.can?.createSettlement ? (
              <div className="text-xs text-muted-foreground">
                Энэ бүртгэлд одоогоор тооцоо үүсгэх боломжгүй (төлөв эсвэл эрх).
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
