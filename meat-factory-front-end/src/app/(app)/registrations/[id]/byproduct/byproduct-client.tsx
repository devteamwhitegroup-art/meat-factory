"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { ANIMAL_MN } from "@/lib/format/enum";
import { formatNumber } from "@/lib/format/money";
import {
  DerivedByproductsDoc,
  RegistrationDetailDoc,
  SetRegistrationByproductsDoc,
} from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

type Row = {
  name: string;
  animalType: string | null;
  wrapperName: string | null;
  // From the wrapper config. Drives the handoff ownership rule:
  //   false → factory storage always
  //   true  → herder may keep (unless verifier toggles cover at verify)
  canCoverSlaughterCost: boolean;
  quantity: string;
  unitWeightKg: number | null;
};

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
  const { data: derived, loading: derivedLoading } = useQuery(
    DerivedByproductsDoc,
    {
      variables: { registrationId: id },
      fetchPolicy: "cache-and-network",
    },
  );
  const [save] = useMutation(SetRegistrationByproductsDoc);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const reg = data?.registration?.registration;

  // Seed editable rows: standard yield from constants, with quantities
  // overridden by anything already saved on the registration.
  const derivedItems = useMemo(
    () => compact(derived?.derivedByproducts?.items),
    [derived],
  );
  const savedLogs = useMemo(() => compact(reg?.byproductLogs), [reg]);

  useEffect(() => {
    if (seeded) return;
    if (!reg) return;
    // Wait for the derived query to settle — otherwise a cache-warm
    // registration can race us and we'd lock in an empty rows array
    // before the catalogue arrives.
    if (derivedLoading && !derived) return;
    const savedByKey = new Map(
      savedLogs
        .filter((l) => l.name)
        .map((l) => [`${l.animalType ?? ""}|${l.name}`, l]),
    );
    const base: Row[] =
      derivedItems.length > 0
        ? derivedItems.map((d) => {
            const saved = savedByKey.get(`${d.animalType ?? ""}|${d.name}`);
            return {
              name: d.name!,
              animalType: d.animalType ?? null,
              wrapperName: d.wrapperName ?? null,
              canCoverSlaughterCost: !!d.canCoverSlaughterCost,
              quantity: String(saved?.count ?? d.quantity ?? 0),
              unitWeightKg: d.unitWeightKg ?? null,
            };
          })
        : savedLogs
            .filter((l) => l.name)
            .map((l) => ({
              name: l.name!,
              animalType: l.animalType ?? null,
              wrapperName: null,
              canCoverSlaughterCost: !!l.canCoverSlaughterCost,
              quantity: String(l.count ?? 0),
              unitWeightKg:
                l.averageWeightKg != null ? Number(l.averageWeightKg) : null,
            }));
    // Seed editable rows once, after the derived/saved queries settle (the
    // `seeded` guard runs this a single time) — a legitimate async-data seed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(base);
    setSeeded(true);
  }, [reg, derivedItems, savedLogs, derived, derivedLoading, seeded]);

  // Nest rows: Animal → Wrappers (багц) → Items. Keep the original row index
  // so each input still updates the right entry. MUST be declared before any
  // conditional early-return (Rules of Hooks).
  const grouped = useMemo(() => {
    const m = new Map<string, Map<string, { row: Row; index: number }[]>>();
    rows.forEach((r, i) => {
      const animal = r.animalType ?? "OTHER";
      const wrapper = r.wrapperName ?? "—";
      if (!m.has(animal)) m.set(animal, new Map());
      const wmap = m.get(animal)!;
      if (!wmap.has(wrapper)) wmap.set(wrapper, []);
      wmap.get(wrapper)!.push({ row: r, index: i });
    });
    return Array.from(m.entries()).map(([animalType, wmap]) => ({
      animalType,
      animalLabel: ANIMAL_MN[animalType] ?? animalType,
      wrappers: Array.from(wmap.entries()).map(([wrapperName, items]) => ({
        wrapperName,
        items,
      })),
    }));
  }, [rows]);

  function totalKg(items: { row: Row }[]) {
    return items.reduce((s, { row }) => {
      const q = Number(row.quantity) || 0;
      return s + (row.unitWeightKg != null ? q * row.unitWeightKg : 0);
    }, 0);
  }

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  function setQty(i: number, v: string) {
    setRows((s) => s.map((r, idx) => (idx === i ? { ...r, quantity: v } : r)));
  }

  async function onSave() {
    const items = rows
      .map((r) => {
        const quantity = Math.floor(Number(r.quantity) || 0);
        const weightKg =
          r.unitWeightKg != null
            ? Number((quantity * r.unitWeightKg).toFixed(2))
            : null;
        return {
          name: r.name,
          animalType: (r.animalType || null) as never,
          quantity,
          weightKg,
          canCoverSlaughterCost: r.canCoverSlaughterCost,
        };
      })
      .filter((i) => i.quantity > 0);

    setBusy(true);
    await runMutation(
      async () =>
        (await save({ variables: { registrationId: id, items } })).data
          ?.setRegistrationByproducts,
      { success: "Дайвар хадгалагдлаа", onSuccess: refetch },
    );
    setBusy(false);
  }

  const editable = reg.status === "WEIGHED";

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
        <Button
          variant="outline"
          onClick={() => router.push(`/registrations/${id}/verify`)}
        >
          Дараах: Баталгаажуулалт →
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Энэ малын төрөлд тохируулсан дайвар норм алга. «Дайвар норм» хэсэгт
          нэмнэ үү.
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Багц тус бүрд тоо ширхэгийг шалгаж, шаардлагатай бол өөрчилнө үү.
          </div>

          <div className="space-y-4">
            {grouped.map((animalGroup) => {
              const animalTotal = animalGroup.wrappers.reduce(
                (a, w) => a + totalKg(w.items),
                0,
              );
              // Ownership lives on the Animal config, so it's the same for
              // every wrapper/item under this animal — show the badge once,
              // on the animal card header.
              const coverable =
                !!animalGroup.wrappers[0]?.items[0]?.row.canCoverSlaughterCost;
              return (
                <Card key={animalGroup.animalType}>
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">
                          {animalGroup.animalLabel}
                        </CardTitle>
                        {coverable ? (
                          <Badge
                            className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                            title="Малчинтай хэлэлцсэнээр өөртөө авна; нөхөвөл үйлдвэрт орно"
                          >
                            Малчны эзэмшил
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                            Үйлдвэрийн нөөц
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {animalGroup.wrappers.length} багц
                      </div>
                    </div>
                    {animalTotal > 0 ? (
                      <Badge className="border-0 bg-primary/10 text-primary">
                        {formatNumber(animalTotal)} кг
                      </Badge>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {animalGroup.wrappers.map((w) => {
                      const wTotal = totalKg(w.items);
                      return (
                        <div
                          key={w.wrapperName}
                          className="rounded-md border bg-muted/30"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                            <div className="text-sm font-semibold">
                              {w.wrapperName}
                            </div>
                            {wTotal > 0 ? (
                              <Badge className="border bg-background text-foreground">
                                {formatNumber(wTotal)} кг
                              </Badge>
                            ) : null}
                          </div>
                          <ul className="divide-y">
                            {w.items.map(({ row, index }) => {
                              const qty = Number(row.quantity) || 0;
                              const weight =
                                row.unitWeightKg != null
                                  ? qty * row.unitWeightKg
                                  : null;
                              return (
                                <li
                                  key={`${row.animalType}|${row.name}`}
                                  className="flex items-center gap-3 px-3 py-2.5"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-base font-medium">
                                      {row.name}
                                    </div>
                                    {row.unitWeightKg != null ? (
                                      <div className="text-xs text-muted-foreground">
                                        ~{formatNumber(row.unitWeightKg)}{" "}
                                        кг/ширхэг
                                      </div>
                                    ) : null}
                                  </div>
                                  <Input
                                    inputMode="numeric"
                                    value={row.quantity}
                                    disabled={!editable}
                                    onChange={(e) =>
                                      setQty(index, e.target.value)
                                    }
                                    className="h-11 w-20 shrink-0 text-center text-lg tabular-nums"
                                  />
                                  <div className="w-20 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                                    {weight != null
                                      ? `${formatNumber(weight)} кг`
                                      : "—"}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={onSave}
            disabled={busy || !editable}
            className="h-14 w-full text-base"
          >
            {busy ? "Хадгалж байна…" : "Дайвар хадгалах"}
          </Button>
          {!editable ? (
            <div className="text-xs text-muted-foreground">
              Дайвар бүртгэхийн тулд статус «Жинлэсэн» байх ёстой.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
