import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClient } from "@/lib/apollo/server";
import { SalesDetailDoc } from "@/lib/queries/sales";
import { compact } from "@/lib/compact";
import { PAYMENT_STATUS_MN } from "@/lib/format/enum";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { fmtDate, fmtDateTime } from "@/lib/format/date";
import { MarkPaidButton } from "./mark-paid-button";
import { InstallmentsCard } from "./installments-card";
import { LineItemsTable } from "./line-items-table";
import { BackButton } from "@/components/common/BackButton";
import { requireCap } from "@/lib/auth/server";

type Props = { params: Promise<{ id: string }> };

export default async function SalesDetailPage({ params }: Props) {
  await requireCap("sales");
  const { id } = await params;
  const { data } = await getClient().query({
    query: SalesDetailDoc,
    variables: { id },
  });
  const wrap = data?.salesTransaction;
  if (!wrap?.success || !wrap.salesTransaction) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        {wrap?.message ?? "Олдсонгүй"}
      </div>
    );
  }
  const t = wrap.salesTransaction;
  const lines = compact(t.lineItems);
  const installments = compact(t.installments).map((i) => ({
    id: i.id!,
    amountMnt: Number(i.amountMnt ?? 0),
    paidAt: String(i.paidAt ?? ""),
    notes: i.notes ?? null,
    createdBy: i.createdBy?.param ?? null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <BackButton href="/sales" />
          <div>
            <div className="text-sm text-muted-foreground">Гүйлгээний код</div>
            <h1 className="font-mono text-2xl font-semibold">
              {t.transactionCode}
            </h1>
          </div>
        </div>
        <Badge
          className={
            t.paymentStatus === "PAID"
              ? "border-0 bg-emerald-100 text-emerald-800"
              : "border-0 bg-amber-100 text-amber-800"
          }
        >
          {PAYMENT_STATUS_MN[t.paymentStatus ?? ""] ?? t.paymentStatus}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Харилцагч</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Нэр</div>
            <div>{t.customer?.name}</div>
            <div className="text-muted-foreground">Утас</div>
            <div>{t.customer?.contactPhone ?? "—"}</div>
            <div className="text-muted-foreground">Дансны дугаар</div>
            <div>{t.customer?.bankAccount ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Гүйлгээ</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Огноо</div>
            <div>{fmtDate(t.transactionDate)}</div>
            <div className="text-muted-foreground">Жин</div>
            <div>{formatNumber(t.totalWeightKg)} кг</div>
            <div className="text-muted-foreground">Дүн</div>
            <div className="font-medium">
              {t.amount != null ? (
                formatMNT(t.amount)
              ) : (
                <span className="text-amber-700 dark:text-amber-400">
                  Үнэ тохируулаагүй
                </span>
              )}
            </div>
            {t.shipmentId && t.shipment?.shipmentCode ? (
              <>
                <div className="text-muted-foreground">Ачилт</div>
                <div>
                  <Link
                    href={`/shipments/${t.shipmentId}`}
                    className="text-primary underline"
                  >
                    {t.shipment.shipmentCode}
                  </Link>
                </div>
              </>
            ) : null}
            {t.paidAt ? (
              <>
                <div className="text-muted-foreground">Төлсөн</div>
                <div>{fmtDateTime(t.paidAt)}</div>
              </>
            ) : null}
            {t.notes ? (
              <>
                <div className="text-muted-foreground">Тэмдэглэл</div>
                <div>{t.notes}</div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Бараа</CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemsTable
            lines={lines.map((l) => ({
              id: l.id!,
              productType: l.productType ?? null,
              animalType: l.animalType ?? null,
              byproductName: l.byproductName ?? null,
              quantityKg: Number(l.quantityKg ?? 0),
              unitPrice: l.unitPrice != null ? Number(l.unitPrice) : null,
              lineAmount: l.lineAmount != null ? Number(l.lineAmount) : null,
            }))}
          />
        </CardContent>
      </Card>

      {t.id && t.amount != null ? (
        <InstallmentsCard
          txId={t.id}
          amount={Number(t.amount)}
          installments={installments}
        />
      ) : (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Бүх барааны үнийг дээрх хүснэгтэд тохируулснаар төлбөр бүртгэх
          боломжтой болно.
        </div>
      )}

      <Separator />

      {t.paymentStatus !== "PAID" && t.amount != null && t.id ? (
        <MarkPaidButton id={t.id} />
      ) : null}
    </div>
  );
}
