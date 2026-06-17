"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/registration/StatusBadge";
import {
  SettlementPreview,
  type LineInput,
} from "@/components/registration/SettlementPreview";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateSettlementDoc,
  MarkSettlementPaidDoc,
  RegistrationDetailDoc,
} from "@/lib/queries/registration";
import { AnimalListDoc } from "@/lib/queries/animal";
import { unwrap } from "@/lib/unwrap";
import { ANIMAL_MN, PAYMENT_STATUS_MN } from "@/lib/format/enum";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { fmtDateTime } from "@/lib/format/date";
import { compact } from "@/lib/compact";

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
    try {
      const r = await createSettlement({
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
      });
      const created = unwrap(r.data?.createSettlement).settlement;
      if (!created) throw new Error("Хариу буцаасангүй");
      toast.success(
        `Тооцоо үүсгэгдлээ — цэвэр ${formatMNT(created.netPayable)}`,
      );
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onMarkPaid() {
    setBusy(true);
    try {
      const r = await markPaid({ variables: { registrationId: id } });
      unwrap(r.data?.markSettlementPaid);
      toast.success("Төлбөр төлсөнд тэмдэглэгдлээ");
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
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
        <section data-print="settlement">
          <div className="mb-3 flex justify-end print-hide">
            <Button variant="outline" onClick={() => window.print()}>
              Хэвлэх
            </Button>
          </div>
          <div className="hidden print:mb-4 print:block">
            <div className="text-2xl font-semibold">
              Тооцооны баримт — Бүртгэл #{reg.registrationNumber}
            </div>
            <div className="text-xs text-muted-foreground">
              Малчин: {reg.herder?.name ?? "—"} · Регистр:{" "}
              {reg.herder?.registrationNo ?? "—"} · Утас:{" "}
              {reg.herder?.phone ?? "—"}
            </div>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Тооцоо</CardTitle>
              <Badge
                className={
                  existing.isPaid
                    ? "border-0 bg-emerald-100 text-emerald-800"
                    : "border-0 bg-amber-100 text-amber-800"
                }
              >
                {existing.isPaid
                  ? PAYMENT_STATUS_MN.PAID
                  : PAYMENT_STATUS_MN.PENDING}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Төрөл</TableHead>
                    <TableHead>Хүлээн авсан</TableHead>
                    <TableHead>Үнэ/кг</TableHead>
                    <TableHead>Мах</TableHead>
                    <TableHead>Бой зардал</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compact(existing.lines).map((l) => (
                    <TableRow key={l.id!}>
                      <TableCell>
                        {ANIMAL_MN[l.animalType ?? ""] ?? l.animalType}
                      </TableCell>
                      <TableCell>{formatNumber(l.receivedWeightKg)}</TableCell>
                      <TableCell>{formatMNT(l.pricePerKg)}</TableCell>
                      <TableCell>{formatMNT(l.meatAmount)}</TableCell>
                      <TableCell>{formatMNT(l.slaughterCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator />
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <div className="text-muted-foreground">Нийт мах</div>
                <div className="text-right">
                  {formatMNT(existing.totalMeatAmount)}
                </div>
                <div className="text-muted-foreground">Бой зардал</div>
                <div className="text-right">
                  {formatMNT(existing.totalSlaughterCost)}
                </div>
                <div className="font-medium">Нийт төлбөр</div>
                <div className="text-right font-medium">
                  {formatMNT(existing.grossAmount)}
                </div>
                <div className="text-base font-semibold">Малчинд өгөх дүн</div>
                <div className="text-right text-base font-semibold">
                  {formatMNT(existing.netPayable)}
                </div>
                {existing.isPaid ? (
                  <>
                    <div className="text-muted-foreground">Төлсөн</div>
                    <div className="text-right">
                      {fmtDateTime(existing.paidAt)}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Payout destination block — prints on the receipt so the
                  herder sees exactly which account got the money. Falls
                  back to the herder's stored bank info when no override
                  was supplied. */}
              {(() => {
                const account =
                  existing.payoutBankAccount ?? reg.herder?.bankAccount ?? null;
                const bank =
                  existing.payoutBankName ?? reg.herder?.bankName ?? null;
                const holder =
                  existing.payoutAccountHolderName ??
                  reg.herder?.accountHolderName ??
                  reg.herder?.name ??
                  null;
                const overridden = !!(
                  existing.payoutBankAccount ||
                  existing.payoutBankName ||
                  existing.payoutAccountHolderName
                );
                if (!account && !bank && !holder) return null;
                return (
                  <div className="rounded-md border bg-muted/20 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Шилжүүлэх данс
                      </span>
                      {overridden ? (
                        <Badge className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                          Бусдын данс
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                      {holder ? (
                        <>
                          <div className="text-muted-foreground">
                            Эзэмшигч
                          </div>
                          <div>{holder}</div>
                        </>
                      ) : null}
                      {bank ? (
                        <>
                          <div className="text-muted-foreground">Банк</div>
                          <div>{bank}</div>
                        </>
                      ) : null}
                      {account ? (
                        <>
                          <div className="text-muted-foreground">Данс</div>
                          <div className="font-mono">{account}</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })()}

              {/* Per-entry weighing detail so the herder can audit how each
                animal's mah → meatAmount was priced. Grouped by animal type,
                numbering restarts per type. */}
              {(() => {
                const entries = compact(reg.weighingEntries);
                if (entries.length === 0) return null;
                // sort by sequenceNo, then assign per-type ordinal so the row
                // numbers mirror the registration detail page.
                const sorted = [...entries].sort(
                  (a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0),
                );
                const perType: Record<string, number> = {};
                const ord: Record<string, number> = {};
                for (const w of sorted) {
                  const t = w.animalType ?? "";
                  perType[t] = (perType[t] ?? 0) + 1;
                  if (w.id) ord[w.id] = perType[t];
                }
                // group by animal type for display, preserving sort order.
                const grouped = new Map<string, typeof sorted>();
                for (const w of sorted) {
                  const t = w.animalType ?? "—";
                  if (!grouped.has(t)) grouped.set(t, []);
                  grouped.get(t)!.push(w);
                }
                return (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">
                      Жинлэлтийн дэлгэрэнгүй
                    </div>
                    {Array.from(grouped.entries()).map(([t, rows]) => {
                      let sub = 0;
                      return (
                        <div key={t} className="rounded-md border">
                          <div className="border-b bg-muted/30 px-3 py-1.5 text-xs font-medium">
                            {ANIMAL_MN[t] ?? t}
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Жин (кг)</TableHead>
                                <TableHead>Үнэ/кг</TableHead>
                                <TableHead>Дүн</TableHead>
                                {/* Per-entry weigher — so SCALE staff can
                                    audit their own name on the receipt. */}
                                <TableHead className="print-hide">
                                  Жинч
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows.map((w) => {
                                const wt = Number(w.weightKg ?? 0);
                                const p = Number(w.pricePerKg ?? 0);
                                const amount = wt * p;
                                sub += amount;
                                return (
                                  <TableRow key={w.id!}>
                                    <TableCell>
                                      {ord[w.id!] ?? w.sequenceNo}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                      {formatNumber(w.weightKg)}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                      {p > 0 ? formatMNT(p) : "—"}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                      {formatMNT(amount)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground print-hide">
                                      {w.scaleOperator?.param ?? "—"}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                          <div className="flex justify-between border-t px-3 py-1.5 text-xs font-medium">
                            <span>{ANIMAL_MN[t] ?? t} нийт</span>
                            <span className="tabular-nums">
                              {formatMNT(sub)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {!existing.isPaid && reg.status === "PAYMENT_PENDING" ? (
                <Button
                  onClick={onMarkPaid}
                  disabled={busy}
                  className="w-full print-hide"
                >
                  {busy ? "..." : "Төлбөр төлсөнд тэмдэглэх"}
                </Button>
              ) : null}
              <div className="mt-4 hidden grid-cols-2 gap-x-8 gap-y-10 print:grid">
                <div className="border-t border-foreground/40 pt-2 text-xs text-muted-foreground">
                  Малчны гарын үсэг
                </div>
                <div className="border-t border-foreground/40 pt-2 text-xs text-muted-foreground">
                  Няравын гарын үсэг
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
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
                Тооцоо үүсгэхийн тулд статус "Баталгаажсан" байх ёстой.
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
