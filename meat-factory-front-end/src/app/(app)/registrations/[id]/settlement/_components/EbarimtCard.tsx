"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime } from "@/lib/format/date";

// eBarimt the factory issues on the herder's behalf for this settlement
// (herder = seller, factory = buyer, VAT-free herder meat). Issued = a ДДТД
// is present and not voided. Actions never print.
export function EbarimtCard({
  ebarimtId,
  ebarimtDate,
  ebarimtIssuedAt,
  ebarimtVoidedAt,
  ebarimtError,
  herderTin,
  canPay,
  busy,
  onIssue,
  onVoid,
}: {
  ebarimtId: string | null;
  ebarimtDate: string | null;
  ebarimtIssuedAt: string | null;
  ebarimtVoidedAt: string | null;
  ebarimtError: string | null;
  herderTin: string | null;
  canPay: boolean;
  busy: boolean;
  onIssue: () => void;
  onVoid: () => void;
}) {
  const issued = !!ebarimtId && !ebarimtVoidedAt;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>И-Баримт</CardTitle>
        <Badge
          className={
            issued
              ? "border-0 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
              : "border-0 bg-muted text-muted-foreground"
          }
        >
          {issued ? "Үүссэн" : ebarimtVoidedAt ? "Цуцалсан" : "Үүсээгүй"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <div className="text-muted-foreground">Малчны ТТД</div>
          <div className="font-mono">
            {herderTin ?? "— (регистрээр автоматаар хайна)"}
          </div>
          {ebarimtId ? (
            <>
              <div className="text-muted-foreground">ДДТД</div>
              <div className="select-all font-mono break-all">{ebarimtId}</div>
              <div className="text-muted-foreground">Огноо</div>
              <div>{ebarimtDate ?? fmtDateTime(ebarimtIssuedAt)}</div>
            </>
          ) : null}
          {ebarimtVoidedAt ? (
            <>
              <div className="text-muted-foreground">Цуцалсан</div>
              <div>{fmtDateTime(ebarimtVoidedAt)}</div>
            </>
          ) : null}
        </div>
        {ebarimtError && !issued ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            {ebarimtError}
          </p>
        ) : null}
        {canPay ? (
          <div className="print-hide">
            {issued ? (
              <Button variant="outline" onClick={onVoid} disabled={busy}>
                {busy ? "..." : "И-Баримт цуцлах"}
              </Button>
            ) : (
              <Button onClick={onIssue} disabled={busy}>
                {busy ? "..." : "И-Баримт үүсгэх"}
              </Button>
            )}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Үйлдвэр малчны өмнөөс НӨАТ-аас чөлөөлөгдсөн махны борлуулалтын баримт
          үүсгэнэ (малчин — борлуулагч, үйлдвэр — худалдан авагч).
        </p>
      </CardContent>
    </Card>
  );
}
