"use client";

import { useMutation, useQuery } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShipmentDetailDoc,
  UpdateShipmentStatusDoc,
} from "@/lib/queries/shipment";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import {
  SHIPMENT_STATUS_MN,
  SHIPMENT_CATEGORY_MN,
  DOMESTIC_MARKET_MN,
} from "@/lib/format/enum";
import { formatNumber } from "@/lib/format/money";
import { fmtDate, fmtDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/common/BackButton";
import { LoadingInfoEditor } from "./_components/LoadingInfoEditor";
import { ShipmentPhotoGallery } from "./_components/ShipmentPhotoGallery";
import { CargoLineForm } from "./_components/CargoLineForm";
import { CargoManifest } from "./_components/CargoManifest";
import { SalePricingPanel } from "./_components/SalePricingPanel";

const CATEGORY_COLOR: Record<string, string> = {
  EXPORT: "border-0 bg-indigo-100 text-indigo-800",
  DOMESTIC: "border-0 bg-teal-100 text-teal-800",
};

const STEPS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Хүлээгдэж буй" },
  { value: "LOADED", label: "Ачигдсан" },
  { value: "DELIVERED", label: "Хүргэгдсэн" },
];

const NEXT: Record<string, string | null> = {
  PENDING: "LOADED",
  LOADED: "DELIVERED",
  DELIVERED: null,
};

export function ShipmentDetailClient({ id }: { id: string }) {
  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(ShipmentDetailDoc, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });
  const [updateStatus] = useMutation(UpdateShipmentStatusDoc);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  const s = data?.shipment?.shipment;
  if (!s) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const stepIdx = STEPS.findIndex((x) => x.value === s.status);
  const nextStatus = NEXT[s.status ?? ""] ?? null;
  // Master switch: a shipment is only editable while PENDING. Once LOADED the
  // manifest, prices and driver info freeze (the back-end enforces this too —
  // any edit mutation past PENDING returns success:false with a lock message,
  // surfaced as a toast via runMutation).
  const editable = s.status === "PENDING";
  const category = s.category ?? "";

  async function advance() {
    if (!nextStatus) return;
    // LOADED is the commit point — confirm so nobody locks themselves out
    // before finishing the manifest/pricing.
    if (
      nextStatus === "LOADED" &&
      !window.confirm(
        "Ачилтыг баталгаажуулснаар бараа, үнэ, жолоочийн мэдээллийг өөрчлөх боломжгүй болно. Үргэлжлүүлэх үү?",
      )
    ) {
      return;
    }
    await runMutation(
      async () =>
        (
          await updateStatus({
            variables: { id, status: nextStatus as never },
          })
        ).data?.updateShipmentStatus,
      { success: "Төлөв шинэчлэгдлээ", onSuccess: refetch },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <BackButton
            href={category ? `/shipments/${category.toLowerCase()}` : undefined}
          />
          <div>
            <div className="text-sm text-muted-foreground">Ачилтын код</div>
            <h1 className="font-mono text-2xl font-semibold">
              {s.shipmentCode}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {category ? (
            <Badge className={CATEGORY_COLOR[category] ?? "border-0 bg-muted"}>
              {SHIPMENT_CATEGORY_MN[category] ?? category}
            </Badge>
          ) : null}
          {category === "DOMESTIC" && s.domesticMarket ? (
            <Badge className="border-0 bg-sky-100 text-sky-800">
              {DOMESTIC_MARKET_MN[s.domesticMarket] ?? s.domesticMarket}
            </Badge>
          ) : null}
          <Badge className="border-0 bg-primary/10 text-primary">
            {SHIPMENT_STATUS_MN[s.status ?? ""] ?? s.status}
          </Badge>
        </div>
      </div>

      {!editable ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Ачилт {SHIPMENT_STATUS_MN[s.status ?? ""] ?? s.status} болсон тул
          зөвхөн харах боломжтой.
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Дараалал: бараа нэмэх → үнэ тохирох → жолоочийн мэдээлэл бөглөх →
          «LOADED болгох».
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {STEPS.map((step, i) => (
              <div key={step.value} className="flex flex-1 items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                    i <= stepIdx
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </div>
                <div className="text-sm">{step.label}</div>
                {i < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "h-px flex-1",
                      i < stepIdx ? "bg-emerald-300" : "bg-muted",
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
          {nextStatus ? (
            <div className="mt-4 flex justify-end">
              <Button onClick={advance}>
                {SHIPMENT_STATUS_MN[nextStatus] ?? nextStatus} болгох
              </Button>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground">
              Дууссан ачилт.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Харилцагч</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Нэр</div>
            <div>{s.customer?.name ?? "—"}</div>
            <div className="text-muted-foreground">Утас</div>
            <div>{s.customer?.contactPhone ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Дэлгэрэнгүй</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Жин</div>
            <div>{formatNumber(s.weightKg)} кг</div>
            {s.serialNumber != null ? (
              <>
                <div className="text-muted-foreground">Серийн дугаар</div>
                <div className="tabular-nums">{s.serialNumber}</div>
              </>
            ) : null}
            <div className="text-muted-foreground">Үүсгэсэн</div>
            <div>{fmtDate(s.createdAt)}</div>
            {s.shippedAt ? (
              <>
                <div className="text-muted-foreground">Хүргэсэн</div>
                <div>{fmtDateTime(s.shippedAt)}</div>
              </>
            ) : null}
            {s.notes ? (
              <>
                <div className="text-muted-foreground">Тэмдэглэл</div>
                <div>{s.notes}</div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <LoadingInfoEditor
        shipmentId={id}
        editable={editable}
        vehiclePlate={s.vehiclePlate ?? null}
        driverName={s.driverName ?? null}
        driverPhone={s.driverPhone ?? null}
        onChanged={refetch}
      />

      <ShipmentPhotoGallery
        shipmentId={id}
        photos={compact(s.photos).map((p) => ({
          id: p.id!,
          sequenceNo: Number(p.sequenceNo ?? 0),
          createdAt: p.createdAt as string | null,
          fileId: p.file?.id ?? null,
          url: p.file?.url ?? null,
        }))}
        onChanged={refetch}
      />

      {editable ? (
        <CargoLineForm
          shipmentId={id}
          category={category}
          onChanged={refetch}
        />
      ) : null}

      <CargoManifest
        editable={editable}
        entries={compact(s.cargoEntries).map((e) => ({
          id: e.id!,
          productLabel: e.productLabel ?? "—",
          pieceCount: e.pieceCount != null ? Number(e.pieceCount) : null,
          grossKg: e.grossKg != null ? Number(e.grossKg) : null,
          tareKg: e.tareKg != null ? Number(e.tareKg) : null,
          weightKg: Number(e.weightKg ?? 0),
          sequenceNo: Number(e.sequenceNo ?? 0),
          createdBy: e.createdBy?.param ?? null,
        }))}
        onChanged={refetch}
      />

      <SalePricingPanel
        editable={editable}
        totalPrice={s.totalPrice != null ? Number(s.totalPrice) : null}
        saleLines={compact(s.saleLines).map((l) => ({
          id: l.id!,
          productType: l.productType ?? null,
          animalType: l.animalType ?? null,
          byproductName: l.byproductName ?? null,
          totalWeightKg: Number(l.totalWeightKg ?? 0),
          pricePerKg: l.pricePerKg != null ? Number(l.pricePerKg) : null,
          amount: l.amount != null ? Number(l.amount) : null,
        }))}
        onChanged={refetch}
      />
    </div>
  );
}
