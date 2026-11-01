"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { RegistrationTitle } from "../_components/RegistrationTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { WeighSlip } from "../_components/WeighSlip";
import { EbarimtCheckCard } from "../_components/EbarimtCheckCard";
import { PreButcheredVerify } from "./PreButcheredVerify";
import { fmtDateTime } from "@/lib/format/date";
import { formatMNT } from "@/lib/format/money";
import { SettlementBreakdown } from "@/components/registration/SettlementBreakdown";
import {
  RegistrationDetailDoc,
  SetRegistrationByproductsDoc,
  VerifyRegistrationDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { useFactories } from "@/lib/factory/FactoriesProvider";
import { useDraft } from "@/lib/hooks/useDraft";

export function VerifyClient({ id }: { id: string }) {
  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(RegistrationDetailDoc, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const [verify] = useMutation(VerifyRegistrationDoc);
  const [saveBundles] = useMutation(SetRegistrationByproductsDoc);
  const [notes, setNotes] = useState("");
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { isPreButchered } = useFactories();
  // Herder's answer per priced wrapper: how many they take back (rest stay
  // with the factory and cover бой зардал). Unset → the saved/default value.
  const [take, setTake] = useState<Record<string, string>>({});
  const clearDraft = useDraft(
    `verify:${id}`,
    { notes, photoFileId, take },
    (d) => {
      setNotes(d.notes);
      setPhotoFileId(d.photoFileId);
      setTake(d.take);
    },
  );

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  const reg = data?.registration?.registration;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;
  // Хойд үйлдвэр: weighed on the intake form — verify = check weighings,
  // count гэдэс, finish weighing (stock in); settles from WEIGHED.
  if (isPreButchered(reg.factory))
    return <PreButcheredVerify reg={reg} onDone={refetch} />;

  const v = reg.verification;
  const editable = !!reg.can?.verify;
  // Every bundle row (saved, or defaults: count = head count, factory keeps
  // all). Only priced wrappers are asked about — unpriced stay with the
  // factory at no credit.
  const bundles = compact(reg.byproductBundles);
  const priced = bundles.filter((b) => Number(b.unitPrice ?? 0) > 0);
  const takeOf = (b: (typeof bundles)[number]) =>
    take[b.wrapperId!] ?? String(b.herderCount ?? 0);
  const keptOf = (b: (typeof bundles)[number]) =>
    Math.max(0, (b.count ?? 0) - (Number(takeOf(b)) || 0));
  // The herder's answer is credited live; everything else (meat, бой
  // зардал) is the backend's settlement preview. Saved → identical to it.
  const totalByproduct = bundles.reduce(
    (sum, b) => sum + keptOf(b) * Number(b.unitPrice ?? 0),
    0,
  );
  const preview = reg.settlementPreview;
  const shown = preview && {
    ...preview,
    totalByproductAmount: totalByproduct,
    netPayable:
      Number(preview.netPayable ?? 0) -
      Number(preview.totalByproductAmount ?? 0) +
      totalByproduct,
  };
  const signed = !!v?.firstVerifiedAt;

  async function sign() {
    for (const b of priced) {
      const n = Number(takeOf(b));
      if (!Number.isInteger(n) || n < 0 || n > (b.count ?? 0)) {
        toast.error(`${b.name}: малчин авах тоо 0–${b.count} байна`);
        return;
      }
    }
    setBusy(true);
    // The herder's take is saved first; verify then locks the step.
    if (priced.length > 0) {
      const ok = await runMutation(
        async () =>
          (
            await saveBundles({
              variables: {
                registrationId: id,
                bundles: bundles.map((b) => ({
                  wrapperId: b.wrapperId!,
                  count: b.count ?? 0,
                  herderCount: Number(takeOf(b)) || 0,
                })),
              },
            })
          ).data?.setRegistrationByproducts,
      );
      if (!ok) {
        setBusy(false);
        return;
      }
    }
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
          clearDraft();
          setTake({});
          setNotes("");
          setPhotoFileId(null);
          refetch();
        },
      },
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
        <div className="flex items-center gap-2">
          {/* Herder's byproduct take is decided here, so verify leads
              straight to the settlement. */}
          {signed ? (
            <Link
              href={`/registrations/${id}/settlement`}
              className={buttonVariants()}
            >
              Тооцоо →
            </Link>
          ) : null}
        </div>
      </div>

      {compact(reg.weighingEntries).length > 0 ? <WeighSlip reg={reg} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Баталгаажуулалт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Money the signer confirms — the backend's preview, with the
              herder's гэдэс answer credited live. */}
          {shown ? (
            <SettlementBreakdown
              s={shown}
              hideByproductColumn={editable}
              itemized={
                <>
                  {priced.length > 0 ? (
                    <div className="rounded-md border">
                      <div className="border-b bg-muted/30 px-4 py-2">
                        <div className="text-sm font-semibold">
                          Дайвар — бой зардлыг нөхнө
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Малчнаас асууна: дайвараа авах уу, үйлдвэрт өгөх үү.
                          Үйлдвэрт өгсөн бүрийг үнээр нь тооцно.
                        </div>
                      </div>
                      <div className="divide-y">
                        {priced.map((b) => {
                          const count = b.count ?? 0;
                          const set = (n: number) =>
                            setTake({ ...take, [b.wrapperId!]: String(n) });
                          return (
                            <div
                              key={b.wrapperId}
                              className="flex flex-wrap items-center gap-3 px-4 py-3"
                            >
                              <div className="min-w-32 flex-1">
                                <div className="font-medium">{b.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {b.animalType} · {count} ш ·{" "}
                                  {formatMNT(Number(b.unitPrice ?? 0))}
                                </div>
                              </div>
                              {editable ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => set(count)}
                                  >
                                    Малчин авна
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => set(0)}
                                  >
                                    Үйлдвэрт өгнө
                                  </Button>
                                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    Малчин авах
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min={0}
                                      max={count}
                                      value={takeOf(b)}
                                      onChange={(e) =>
                                        setTake({
                                          ...take,
                                          [b.wrapperId!]: e.target.value,
                                        })
                                      }
                                      className="h-9 w-16 text-center tabular-nums"
                                    />
                                  </label>
                                </>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Малчин авсан: {takeOf(b)}
                                </div>
                              )}
                              <div className="w-28 text-right text-sm tabular-nums">
                                <div>Үйлдвэрт {keptOf(b)} ш</div>
                                <div className="font-medium">
                                  {formatMNT(
                                    keptOf(b) * Number(b.unitPrice ?? 0),
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between border-t px-4 py-2 text-sm font-medium">
                        <span>Нийт дайвар</span>
                        <span>{formatMNT(totalByproduct)}</span>
                      </div>
                    </div>
                  ) : null}
                </>
              }
            />
          ) : null}

          {/* Before confirming: the herder's eBarimt, if they allow it. */}
          <EbarimtCheckCard
            registrationId={id}
            taken={!!reg.ebarimtTaken}
            imageFileId={reg.ebarimtImage?.id ?? null}
            imageUrl={reg.ebarimtImage?.url ?? null}
            note={reg.ebarimtNote ?? null}
            canEdit={reg.status !== "CANCELLED"}
            onSaved={refetch}
          />

          <div className="rounded-md border p-4 text-sm">
            <div className="text-muted-foreground">Баталгаажуулсан</div>
            <div className="mt-1 text-base">
              {v?.firstVerifier?.param ?? "— хоосон —"}
            </div>
            <div className="text-xs text-muted-foreground">
              {v?.firstVerifiedAt ? fmtDateTime(v.firstVerifiedAt) : "—"}
            </div>
          </div>

          {!signed && editable && (
            <div className="space-y-3">
              {/* Herder signs the printed weigh slip by hand — no on-screen pad. */}
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
                disabled={busy}
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
