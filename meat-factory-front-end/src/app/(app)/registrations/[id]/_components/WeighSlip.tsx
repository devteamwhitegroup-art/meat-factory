"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RegistrationDetail } from "@/lib/queries/registration";
import { SettlementBreakdown } from "@/components/registration/SettlementBreakdown";
import { fmtDate } from "@/lib/format/date";
import { PrintButton } from "@/components/common/PrintButton";

// Printable weigh/agreement slip (before the settlement). Its money block is
// the backend's settlement preview — the same formula the settlement locks
// in, so the slip and the final settlement always agree. The гэдэс credit
// appears once the herder's take is recorded.
export function WeighSlip({ reg }: { reg: RegistrationDetail }) {
  const sig = reg.agreementSignature?.url ?? null;

  return (
    <section data-print="weigh-slip">
      <div className="mb-3 flex justify-end print-hide">
        {reg.id ? <PrintButton type="WEIGH_SLIP" id={reg.id} /> : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Жинлэлт ба үнийн хуудас</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="text-muted-foreground">Малчин</div>
            <div>{reg.herder?.name ?? "—"}</div>
            <div className="text-muted-foreground">Утас</div>
            <div>{reg.herder?.phone ?? "—"}</div>
            <div className="text-muted-foreground">Бүртгэлийн код</div>
            <div className="font-mono">{reg.registrationCode ?? "—"}</div>
            <div className="text-muted-foreground">Огноо</div>
            <div>{fmtDate(reg.intakeDate)}</div>
            <div className="text-muted-foreground">Машин</div>
            <div>{reg.vehicleNumber ?? "—"}</div>
          </div>

          <Separator />

          {reg.settlementPreview ? (
            <SettlementBreakdown s={reg.settlementPreview} />
          ) : null}

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
