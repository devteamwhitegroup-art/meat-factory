"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { formatMNT, formatNumber } from "@/lib/format/money";
import {
  RegistrationDetailDoc,
  SetRegistrationAgreementSignatureDoc,
  VerifyRegistrationDoc,
} from "@/lib/queries/registration";
import { AnimalListDoc } from "@/lib/queries/animal";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { isPreButchered } from "@/lib/format/enum";

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
  const [setAgreement] = useMutation(SetRegistrationAgreementSignatureDoc);
  // Admin-configured per-head butcher cost — used to compute the slaughter
  // cost the verifier confirms.
  const { data: bcData } = useQuery(AnimalListDoc, {
    fetchPolicy: "cache-and-network",
  });
  const [notes, setNotes] = useState("");
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  const reg = data?.registration?.registration;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;
  // FACTORY_2 has no verify step — stock lands at finishWeighing and finance
  // settles straight from WEIGHED.
  if (isPreButchered(reg.factory))
    return (
      <div className="space-y-3 rounded-md border p-4 text-sm">
        <p>Үйлдвэр 2-т баталгаажуулалт хийгдэхгүй.</p>
        <Link
          href={`/registrations/${id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Бүртгэл рүү буцах
        </Link>
      </div>
    );

  const v = reg.verification;
  const signed =
    reg.status === "VERIFIED" ||
    reg.status === "PAYMENT_PENDING" ||
    reg.status === "SETTLED";

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
            <div className="text-sm text-muted-foreground">Бүртгэлийн код</div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold">
                {reg.registrationCode ?? "—"}
              </h1>
              <StatusBadge status={reg.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reg.status === "VERIFIED" ? (
            <Button
              onClick={() => router.push(`/registrations/${id}/byproduct`)}
            >
              Дараах: Дайвар →
            </Button>
          ) : reg.status === "PAYMENT_PENDING" || reg.status === "SETTLED" ? (
            <Button
              onClick={() => router.push(`/registrations/${id}/settlement`)}
            >
              Тооцоо үүсгэх →
            </Button>
          ) : null}
        </div>
      </div>

      {compact(reg.weighingEntries).length > 0 ? <WeighSlip reg={reg} /> : null}

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
            for (const c of compact(bcData?.animals?.animals)) {
              if (c.name) butcherMap[c.name] = Number(c.pricePerAnimal ?? 0);
            }
            const slaughterTypes = Object.keys(counts);
            const slaughter: Record<
              string,
              { count: number; price: number; subtotal: number }
            > = {};
            let totalSlaughter = 0;
            for (const t of slaughterTypes) {
              const count = counts[t];
              const price = butcherMap[t] ?? 0;
              const subtotal = price * count;
              slaughter[t] = { count, price, subtotal };
              totalSlaughter += subtotal;
            }
            // гэдэс credit is decided after verify (byproduct step) and lands
            // on the settlement — not part of this pre-verify summary.
            const net = totalMeat - totalSlaughter;

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
                          <TableCell>{t}</TableCell>
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
                      {slaughterTypes.map((t) => (
                        <TableRow key={t}>
                          <TableCell>{t}</TableCell>
                          <TableCell>{slaughter[t].count}</TableCell>
                          <TableCell>
                            {slaughter[t].price > 0
                              ? formatMNT(slaughter[t].price)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {formatMNT(slaughter[t].subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between border-t px-4 py-2 text-sm font-medium">
                    <span>Нийт бой зардал</span>
                    <span>{formatMNT(totalSlaughter)}</span>
                  </div>
                  {Object.values(butcherMap).length === 0 ? (
                    <div className="border-t bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                      Бой зардлыг «Админ → Бой зардал» хэсэгт тохируулна уу.
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between rounded-md border bg-primary/5 px-4 py-3 text-base font-semibold">
                  <span>Төлбөр</span>
                  <span>{formatMNT(net)}</span>
                </div>
              </>
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
