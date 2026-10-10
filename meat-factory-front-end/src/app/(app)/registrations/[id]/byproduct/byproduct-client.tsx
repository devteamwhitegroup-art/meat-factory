"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { BackButton } from "@/components/common/BackButton";
import { formatMNT } from "@/lib/format/money";
import { isPreButchered } from "@/lib/format/enum";
import {
  RegistrationDetailDoc,
  SetRegistrationByproductsDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

// Herder-facing гэдэс bundle: the factory keeps count − herderCount of them
// and credits each kept one at unitPrice to the settlement.
type Bundle = {
  wrapperId: string;
  wrapperName: string;
  animalType: string;
  count: string;
  herderCount: string;
  unitPrice: number;
};

const kept = (b: Pick<Bundle, "count" | "herderCount">) =>
  Math.max(0, (Number(b.count) || 0) - (Number(b.herderCount) || 0));

export function ByproductClient({ id }: { id: string }) {
  const router = useRouter();
  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(RegistrationDetailDoc, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const [save] = useMutation(SetRegistrationByproductsDoc);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [busy, setBusy] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const reg = data?.registration?.registration;

  // Seed once after the registration lands: bundles come from the server
  // (saved, or defaults where the factory keeps everything).
  useEffect(() => {
    if (seeded) return;
    if (!reg) return;
    const b: Bundle[] = compact(reg.byproductBundles).map((x) => ({
      wrapperId: x.wrapperId!,
      wrapperName: x.wrapperName ?? "",
      animalType: x.animalType ?? "",
      count: String(x.count ?? 0),
      herderCount: String(x.herderCount ?? 0),
      unitPrice: Number(x.unitPrice ?? 0),
    }));
    // Seed editable state once after async data lands (guarded by `seeded`).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBundles(b);
    setSeeded(true);
  }, [reg, seeded]);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  // FACTORY_2 records гэдэс only, while receiving — on the weigh page.
  if (isPreButchered(reg.factory)) {
    return (
      <div className="space-y-4">
        <BackButton href={`/registrations/${id}`} />
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Үйлдвэр 2-т гэдэсийг жинлэх хуудсан дээр бүртгэнэ.{" "}
          <Link
            href={`/registrations/${id}/weigh`}
            className="font-medium text-primary underline"
          >
            Жинлэх хуудас руу
          </Link>
        </div>
      </div>
    );
  }

  function setBundle(i: number, patch: Partial<Bundle>) {
    setBundles((s) => s.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  const totalCredit = bundles.reduce((s, b) => s + kept(b) * b.unitPrice, 0);

  async function onSave(): Promise<boolean> {
    for (const b of bundles) {
      const c = Number(b.count) || 0;
      const h = Number(b.herderCount) || 0;
      if (c < 0 || h < 0 || h > c) {
        toast.error(`${b.wrapperName}: малчны авах тоо 0–${c} байх ёстой`);
        return false;
      }
    }
    setBusy(true);
    const ok = await runMutation(
      async () =>
        (
          await save({
            variables: {
              registrationId: id,
              bundles: bundles.map((b) => ({
                wrapperId: b.wrapperId,
                count: Math.floor(Number(b.count) || 0),
                herderCount: Math.floor(Number(b.herderCount) || 0),
              })),
            },
          })
        ).data?.setRegistrationByproducts,
      { success: "Дайвар хадгалагдлаа", onSuccess: refetch },
    );
    setBusy(false);
    return ok;
  }

  const editable = reg.status === "VERIFIED";

  // "Дараах" always saves first so nobody skips logging byproducts. When the
  // page is read-only (already past VERIFIED) there's nothing to save.
  async function onNext() {
    if (editable) {
      const ok = await onSave();
      if (!ok) return;
    }
    router.push(`/registrations/${id}/settlement`);
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
        <Button variant="outline" onClick={onNext} disabled={busy}>
          {busy ? "Хадгалж байна…" : "Дараах: Тооцоо →"}
        </Button>
      </div>

      {bundles.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Энэ малын төрөлд тохируулсан дайвар норм алга. «Дайвар норм» хэсэгт
          нэмнэ үү.
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Гэдэс</CardTitle>
              <div className="text-xs text-muted-foreground">
                Малчин авахгүй гэдэс бүр үйлдвэрт үлдэж, үнээрээ бой зардлаас
                хасагдана.
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="hidden grid-cols-[1fr_5rem_5rem_6rem_7rem] gap-3 px-1 text-xs text-muted-foreground sm:grid">
                <span>Нэр</span>
                <span className="text-center">Тоо</span>
                <span className="text-center">Малчин авах</span>
                <span className="text-right">Үнэ</span>
                <span className="text-right">Үйлдвэрт / дүн</span>
              </div>
              {bundles.map((b, i) => (
                <div
                  key={b.wrapperId}
                  className="grid grid-cols-2 items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 sm:grid-cols-[1fr_5rem_5rem_6rem_7rem]"
                >
                  <div className="col-span-2 sm:col-span-1">
                    <div className="font-medium">{b.wrapperName}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.animalType}
                    </div>
                  </div>
                  <Input
                    aria-label="Тоо"
                    inputMode="numeric"
                    value={b.count}
                    disabled={!editable}
                    onChange={(e) => setBundle(i, { count: e.target.value })}
                    className="h-11 text-center text-lg tabular-nums"
                  />
                  <Input
                    aria-label="Малчин авах"
                    inputMode="numeric"
                    value={b.herderCount}
                    disabled={!editable}
                    onChange={(e) =>
                      setBundle(i, { herderCount: e.target.value })
                    }
                    className="h-11 text-center text-lg tabular-nums"
                  />
                  <div className="text-right text-sm tabular-nums">
                    {formatMNT(b.unitPrice)}
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <div>{kept(b)} ш</div>
                    <div className="font-medium">
                      {formatMNT(kept(b) * b.unitPrice)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Дайварын дүн (бой зардлаас хасна)</span>
                <span className="tabular-nums">{formatMNT(totalCredit)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={onSave}
            disabled={busy || !editable}
            className="h-14 w-full text-base"
          >
            {busy ? "Хадгалж байна…" : "Дайвар хадгалах"}
          </Button>
          {!editable ? (
            <div className="text-xs text-muted-foreground">
              Дайвар бүртгэхийн тулд статус «Баталгаажсан» байх ёстой.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
