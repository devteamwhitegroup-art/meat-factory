"use client";

import type { ResultOf } from "@graphql-typed-document-node/core";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegistrationDetailDoc } from "@/lib/queries/registration";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { fmtDate } from "@/lib/format/date";
import { compact } from "@/lib/compact";

type Reg = NonNullable<
  NonNullable<
    ResultOf<typeof RegistrationDetailDoc>["registration"]
  >["registration"]
>;

// Printable weigh/agreement slip (status WEIGHED, before VERIFIED). Numbers are
// derived from the same data settlement will use — meat = Σ(weightKg×pricePerKg),
// бой = animalLines.slaughterCost — so the slip and the final settlement agree.
// When the verifier marks the slaughter cost covered by byproducts, the бой of
// the coverable animal types is offset to 0 here too (matches the summary).
export function WeighSlip({
  reg,
  covered = false,
  coverByType = {},
}: {
  reg: Reg;
  covered?: boolean;
  coverByType?: Record<string, boolean>;
}) {
  const { animalName } = useAnimalCatalog();
  const entries = compact(reg.weighingEntries);

  // Meat income per type from per-entry negotiated price.
  const meatByType: Record<string, { weight: number; meat: number }> = {};
  for (const e of entries) {
    const t = e.animalType ?? "";
    const w = Number(e.weightKg ?? 0);
    const p = Number(e.pricePerKg ?? 0);
    if (!meatByType[t]) meatByType[t] = { weight: 0, meat: 0 };
    meatByType[t].weight += w;
    meatByType[t].meat += w * p;
  }

  // Captured бой cost per type.
  const boyByType: Record<string, number> = {};
  for (const l of compact(reg.animalLines)) {
    const t = l.animalType ?? "";
    boyByType[t] = (boyByType[t] ?? 0) + Number(l.slaughterCost ?? 0);
  }

  const types = Array.from(
    new Set([...Object.keys(meatByType), ...Object.keys(boyByType)]),
  );
  let gross = 0;
  let totalBoy = 0;
  const rows = types.map((t) => {
    const weight = meatByType[t]?.weight ?? 0;
    const meat = meatByType[t]?.meat ?? 0;
    // Coverable types' бой is offset to 0 when the verifier enabled cover.
    const offset = covered && !!coverByType[t];
    const boy = offset ? 0 : (boyByType[t] ?? 0);
    gross += meat;
    totalBoy += boy;
    return {
      type: t,
      weight,
      pricePerKg: weight > 0 ? meat / weight : 0,
      meat,
      boy,
      rawBoy: boyByType[t] ?? 0,
      offset,
      net: meat - boy,
    };
  });
  const netPayable = gross - totalBoy;
  const sig = reg.agreementSignature?.url ?? null;

  return (
    <section data-print="weigh-slip">
      <div className="mb-3 flex justify-end print-hide">
        <Button variant="outline" onClick={() => window.print()}>
          Хэвлэх
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Жинлэлт ба үнийн хуудас</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {/* Header */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="text-muted-foreground">Малчин</div>
            <div>{reg.herder?.name ?? "—"}</div>
            <div className="text-muted-foreground">Бүртгэлийн код</div>
            <div className="font-mono">{reg.registrationCode ?? "—"}</div>
            <div className="text-muted-foreground">Огноо</div>
            <div>{fmtDate(reg.intakeDate)}</div>
            <div className="text-muted-foreground">Машин</div>
            <div>{reg.vehicleNumber ?? "—"}</div>
          </div>

          <Separator />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Төрөл</TableHead>
                <TableHead className="text-right">Жин (кг)</TableHead>
                <TableHead className="text-right">Үнэ/кг</TableHead>
                <TableHead className="text-right">Махны дүн</TableHead>
                <TableHead className="text-right">Бой зардал</TableHead>
                <TableHead className="text-right">Цэвэр</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.type}>
                  <TableCell>{animalName.get(r.type) ?? r.type}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.weight)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.pricePerKg > 0 ? formatMNT(r.pricePerKg) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMNT(r.meat)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.offset ? (
                      <span className="text-amber-700">
                        <span className="text-muted-foreground line-through">
                          {formatMNT(r.rawBoy)}
                        </span>{" "}
                        0
                      </span>
                    ) : (
                      formatMNT(r.boy)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMNT(r.net)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator />

          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="text-muted-foreground">Нийт мах</div>
            <div className="text-right tabular-nums">{formatMNT(gross)}</div>
            <div className="text-muted-foreground">Нийт бой зардал</div>
            <div className="text-right tabular-nums">{formatMNT(totalBoy)}</div>
            <div className="text-base font-semibold">Малчинд өгөх дүн</div>
            <div className="text-right text-base font-semibold tabular-nums">
              {formatMNT(netPayable)}
            </div>
          </div>

          {/* Agreement signature — printed so the signed slip carries price,
              бой cost, net and the herder's consent signature. */}
          <div className="pt-4">
            <div className="mb-1 text-xs text-muted-foreground">
              Малчны гарын үсэг (зөвшөөрсөн)
            </div>
            {sig ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sig}
                alt="Малчны гарын үсэг"
                className="h-20 w-auto object-contain"
              />
            ) : (
              <div className="h-16 border-b border-foreground/40" />
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
