"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { BackButton } from "@/components/common/BackButton";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { SignatureField } from "@/components/common/SignatureField";
import { WeighSlip } from "../_components/WeighSlip";
import { fmtDateTime } from "@/lib/format/date";
import { ANIMAL_MN } from "@/lib/format/enum";
import { formatMNT, formatNumber } from "@/lib/format/money";
import {
  DerivedByproductsDoc,
  RegistrationDetailDoc,
  SetSlaughterCoveredDoc,
  SetRegistrationAgreementSignatureDoc,
  VerifyRegistrationDoc,
} from "@/lib/queries/registration";
import { AnimalListDoc } from "@/lib/queries/animal";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

export function VerifyClient({ id }: { id: string }) {
  const router = useRouter();
  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(RegistrationDetailDoc, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const [verify] = useMutation(VerifyRegistrationDoc);
  const [setCovered] = useMutation(SetSlaughterCoveredDoc);
  const [setAgreement] = useMutation(SetRegistrationAgreementSignatureDoc);
  // Admin-configured per-head butcher cost — used to compute the slaughter
  // cost the verifier confirms.
  const { data: bcData } = useQuery(AnimalListDoc, {
    fetchPolicy: "cache-and-network",
  });
  // Derived byproducts for this registration; the wrapper.canCoverSlaughterCost
  // flag marks the ones eligible to offset slaughter cost (horse өлөн гэдэс).
  const { data: dbData } = useQuery(DerivedByproductsDoc, {
    variables: { registrationId: id },
    fetchPolicy: "cache-and-network",
  });
  const [notes, setNotes] = useState("");
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  const reg = data?.registration?.registration;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const v = reg.verification;
  const signed =
    reg.status === "VERIFIED" ||
    reg.status === "PAYMENT_PENDING" ||
    reg.status === "SETTLED";
  const covered = !!v?.slaughterCoveredByByproduct;
  const canToggleCover = reg.status === "WEIGHED" || reg.status === "VERIFIED";
  // Which animal types can have their slaughter cost offset by byproducts
  // (Animal.canCoverSlaughterCost). Shared with the slip so its бой total
  // tracks the cover toggle, same as the summary below.
  const coverByType: Record<string, boolean> = {};
  for (const c of compact(bcData?.animals?.animals)) {
    if (c.animalType) coverByType[c.animalType] = !!c.canCoverSlaughterCost;
  }

  async function toggleCover() {
    setBusy(true);
    await runMutation(
      async () =>
        (
          await setCovered({
            variables: { registrationId: id, covered: !covered },
          })
        ).data?.setSlaughterCovered,
      {
        success: covered
          ? "Нөхөлт цуцлагдлаа"
          : "Бой зардал дайвараар нөхөгдлөө",
        onSuccess: refetch,
      },
    );
    setBusy(false);
  }

  async function sign() {
    setBusy(true);
    await runMutation(
      async () =>
        (
          await verify({
            variables: {
              registrationId: id,
              notes: notes.trim() || null,
              photoFileId: photoFileId ?? null,
            },
          })
        ).data?.verifyRegistration,
      {
        success: "Баталгаажилт амжилттай",
        onSuccess: () => {
          setNotes("");
          setPhotoFileId(null);
          refetch();
        },
      },
    );
    setBusy(false);
  }

  // Persist the herder's agreement signature (uploaded via SignatureField).
  // Only fires on a real fileId — SignaturePad also emits null while redrawing.
  async function onSaveAgreement(fileId: string | null) {
    if (!fileId) return;
    setBusy(true);
    await runMutation(
      async () =>
        (
          await setAgreement({
            variables: { registrationId: id, fileId },
          })
        ).data?.setRegistrationAgreementSignature,
      { success: "Зөвшөөрлийн гарын үсэг хадгалагдлаа", onSuccess: refetch },
    );
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <BackButton href={`/registrations/${id}`} />
          <div>
            <div className="text-sm text-muted-foreground">
              Бүртгэлийн дугаар
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">
                #{reg.registrationNumber}
              </h1>
              <StatusBadge status={reg.status} />
            </div>
          </div>
        </div>
        {reg.status === "VERIFIED" ||
        reg.status === "PAYMENT_PENDING" ||
        reg.status === "SETTLED" ? (
          <Button
            onClick={() => router.push(`/registrations/${id}/settlement`)}
          >
            Тооцоо үүсгэх →
          </Button>
        ) : null}
      </div>

      {reg.status === "WEIGHED" ? (
        <WeighSlip reg={reg} covered={covered} coverByType={coverByType} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Баталгаажуулалт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Money summary the signer confirms: мах − бой зардал ≈ цэвэр төлбөр. */}
          {(() => {
            // Meat = weight × per-entry negotiated price.
            const entries = compact(reg.weighingEntries);
            const byType: Record<string, { received: number; meat: number }> =
              {};
            for (const w of entries) {
              const t = w.animalType ?? "";
              const wt = Number(w.weightKg ?? 0);
              const price = Number(w.pricePerKg ?? 0);
              if (!byType[t]) byType[t] = { received: 0, meat: 0 };
              byType[t].received += wt;
              byType[t].meat += wt * price;
            }
            const totalMeat = Object.values(byType).reduce(
              (a, b) => a + b.meat,
              0,
            );

            // Slaughter cost = admin pricePerAnimal × count per type.
            const counts: Record<string, number> = {};
            for (const a of compact(reg.animalLines)) {
              const t = a.animalType ?? "";
              if (t) counts[t] = (counts[t] ?? 0) + (a.count ?? 0);
            }
            const butcherMap: Record<string, number> = {};
            // canCover lives on the Animal config per type — only animals
            // flagged here are offset when the verifier toggles cover.
            const coverByType: Record<string, boolean> = {};
            for (const c of compact(bcData?.animals?.animals)) {
              if (c.animalType) {
                butcherMap[c.animalType] = Number(c.pricePerAnimal ?? 0);
                coverByType[c.animalType] = !!c.canCoverSlaughterCost;
              }
            }
            const slaughterTypes = Object.keys(counts);
            const slaughter: Record<
              string,
              {
                count: number;
                price: number;
                subtotal: number;
                coverable: boolean;
              }
            > = {};
            let totalSlaughter = 0;
            let coveredAmount = 0;
            for (const t of slaughterTypes) {
              const count = counts[t];
              const price = butcherMap[t] ?? 0;
              const subtotal = price * count;
              const coverable = !!coverByType[t];
              slaughter[t] = { count, price, subtotal, coverable };
              totalSlaughter += subtotal;
              if (coverable) coveredAmount += subtotal;
            }
            // Cover toggle: when active, ONLY animals where canCover=true
            // get their slaughter cost offset. Others still charge.
            const effectiveSlaughter = covered
              ? totalSlaughter - coveredAmount
              : totalSlaughter;
            const net = totalMeat - effectiveSlaughter;

            return (
              <>
                <div className="rounded-md border">
                  <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
                    Махны орлого
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Төрөл</TableHead>
                        <TableHead>Жин (кг)</TableHead>
                        <TableHead>Дундаж үнэ/кг</TableHead>
                        <TableHead>Махны дүн</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(byType).map(([t, x]) => (
                        <TableRow key={t}>
                          <TableCell>{ANIMAL_MN[t] ?? t}</TableCell>
                          <TableCell>{formatNumber(x.received)}</TableCell>
                          <TableCell>
                            {formatMNT(
                              x.received > 0 ? x.meat / x.received : 0,
                            )}
                          </TableCell>
                          <TableCell>{formatMNT(x.meat)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between border-t px-4 py-2 text-sm font-medium">
                    <span>Нийт мах</span>
                    <span>{formatMNT(totalMeat)}</span>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
                    Бой зардал
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Төрөл</TableHead>
                        <TableHead>Тоо</TableHead>
                        <TableHead>1 толгойн үнэ</TableHead>
                        <TableHead>Дүн</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slaughterTypes.map((t) => {
                        const offset = covered && slaughter[t].coverable;
                        return (
                          <TableRow key={t}>
                            <TableCell>{ANIMAL_MN[t] ?? t}</TableCell>
                            <TableCell>{slaughter[t].count}</TableCell>
                            <TableCell>
                              {slaughter[t].price > 0
                                ? formatMNT(slaughter[t].price)
                                : "—"}
                            </TableCell>
                            <TableCell
                              className={
                                offset
                                  ? "text-amber-900 line-through dark:text-amber-200"
                                  : ""
                              }
                            >
                              {formatMNT(slaughter[t].subtotal)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {covered && coveredAmount > 0 ? (
                        <TableRow className="bg-amber-50 dark:bg-amber-950/20">
                          <TableCell
                            colSpan={3}
                            className="font-medium text-amber-900 dark:text-amber-200"
                          >
                            Дайвараар нөхөгдсөн
                          </TableCell>
                          <TableCell className="font-medium text-amber-900 dark:text-amber-200">
                            −{formatMNT(coveredAmount)}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between border-t px-4 py-2 text-sm font-medium">
                    <span>Нийт бой зардал</span>
                    <span>{formatMNT(effectiveSlaughter)}</span>
                  </div>
                  {Object.values(butcherMap).length === 0 ? (
                    <div className="border-t bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                      Бой зардлыг «Админ → Бой зардал» хэсэгт тохируулна уу.
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between rounded-md border bg-primary/5 px-4 py-3 text-base font-semibold">
                  <span>Цэвэр төлбөр (тооцоолсон)</span>
                  <span>{formatMNT(net)}</span>
                </div>
              </>
            );
          })()}

          {/* Coverable byproducts — horse "өлөн гэдэс" etc. flagged on the
              wrapper. Informational: the verifier sees what could offset the
              slaughter cost if negotiated with the herder. */}
          {(() => {
            const items = compact(dbData?.derivedByproducts?.items).filter(
              (i) => i.canCoverSlaughterCost,
            );
            if (items.length === 0) return null;
            const groups = new Map<string, typeof items>();
            for (const it of items) {
              const w = it.wrapperName ?? "—";
              if (!groups.has(w)) groups.set(w, []);
              groups.get(w)!.push(it);
            }
            return (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950/30">
                <div className="mb-2 font-semibold text-amber-900 dark:text-amber-200">
                  Бой зардлыг нөхөж болох дайвар
                </div>
                <div className="space-y-2">
                  {Array.from(groups.entries()).map(([wrapper, list]) => (
                    <div key={wrapper}>
                      <div className="font-medium text-amber-900 dark:text-amber-200">
                        {wrapper}
                      </div>
                      <ul className="ml-4 list-disc text-amber-900 dark:text-amber-200">
                        {list.map((it) => (
                          <li key={`${it.animalType}|${it.name}`}>
                            {it.name} — {it.quantity} ширхэг
                            {it.weightKg != null
                              ? ` (${formatNumber(it.weightKg)} кг)`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
                  Эдгээр дайвар нь малчинтай хэлэлцсэнээр бой зардлыг нөхөж
                  болно.
                </p>
                {canToggleCover ? (
                  <Button
                    type="button"
                    variant={covered ? "outline" : "default"}
                    onClick={toggleCover}
                    disabled={busy}
                    className="mt-3"
                  >
                    {covered
                      ? "Нөхөлтийг цуцлах"
                      : "Бой зардлыг дайвараар нөхөх"}
                  </Button>
                ) : null}
                {covered ? (
                  <div className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                    ✓ Бой зардал дайвараар нөхөгдсөн — тооцоо үүсгэх үед бой
                    зардал 0 болж бөглөгдөнө.
                  </div>
                ) : null}
              </div>
            );
          })()}

          <div className="rounded-md border p-4 text-sm">
            <div className="text-muted-foreground">Баталгаажуулсан</div>
            <div className="mt-1 text-base">
              {v?.firstVerifier?.param ?? "— хоосон —"}
            </div>
            <div className="text-xs text-muted-foreground">
              {v?.firstVerifiedAt ? fmtDateTime(v.firstVerifiedAt) : "—"}
            </div>
          </div>

          {!signed && reg.status === "WEIGHED" && (
            <div className="space-y-3">
              {/* Herder consent — required before verifying. Reuses the intake
                  signature pad/upload pattern. */}
              <SignatureField
                value={reg.agreementSignatureFileId ?? null}
                onChange={onSaveAgreement}
                label="Малчны гарын үсэг (зөвшөөрсөн)"
                type="verify"
              />
              {!reg.agreementSignatureFileId ? (
                <p className="text-xs text-amber-700">
                  Баталгаажуулахын өмнө малчны зөвшөөрлийн гарын үсгийг авна уу.
                </p>
              ) : null}
              <Textarea
                placeholder="Тэмдэглэл (заавал биш)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <PhotoUpload
                value={photoFileId}
                onChange={setPhotoFileId}
                type="verify"
                label="Зураг (заавал биш)"
              />
              <Button
                onClick={sign}
                disabled={busy || !reg.agreementSignatureFileId}
                className="h-12 w-full text-base"
              >
                {busy ? "..." : "Баталгаажуулах"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Нярав / нягтлан / админ дангаар баталгаажуулна.
              </p>
            </div>
          )}

          {signed && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
              Баталгаажилт дууссан.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
