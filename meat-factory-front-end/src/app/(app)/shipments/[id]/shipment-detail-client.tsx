'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AddCargoEntryDoc,
  AddShipmentPhotoDoc,
  DeleteCargoEntryDoc,
  RemoveShipmentPhotoDoc,
  ShipmentDetailDoc,
  UpdateCargoEntryPriceDoc,
  UpdateShipmentLoadingInfoDoc,
  UpdateShipmentStatusDoc,
} from '@/lib/queries/shipment';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { KeypadField } from '@/components/forms/KeypadField';
import { unwrap } from '@/lib/unwrap';
import { compact } from '@/lib/compact';
import { SHIPMENT_STATUS_MN, PAYMENT_STATUS_MN } from '@/lib/format/enum';
import { formatNumber, formatMNT } from '@/lib/format/money';
import { fmtDate, fmtDateTime } from '@/lib/format/date';
import { cn } from '@/lib/utils';

const STEPS: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'Хүлээгдэж буй' },
  { value: 'LOADED', label: 'Ачигдсан' },
  { value: 'DELIVERED', label: 'Хүргэгдсэн' },
];

const NEXT: Record<string, string | null> = {
  PENDING: 'LOADED',
  LOADED: 'DELIVERED',
  DELIVERED: null,
};

export function ShipmentDetailClient({ id }: { id: string }) {
  const { data, loading: fetching, refetch } = useQuery(ShipmentDetailDoc, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const [updateStatus] = useMutation(UpdateShipmentStatusDoc);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  const s = data?.shipment?.shipment;
  if (!s) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const stepIdx = STEPS.findIndex((x) => x.value === s.status);
  const nextStatus = NEXT[s.status ?? ''] ?? null;

  async function advance() {
    if (!nextStatus) return;
    try {
      const r = await updateStatus({
        variables: { id, status: nextStatus as never },
      });
      unwrap(r.data?.updateShipmentStatus);
      toast.success('Төлөв шинэчлэгдлээ');
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Ачилтын код</div>
          <h1 className="font-mono text-2xl font-semibold">
            {s.shipmentCode}
          </h1>
        </div>
        <Badge className="border-0 bg-primary/10 text-primary">
          {SHIPMENT_STATUS_MN[s.status ?? ''] ?? s.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {STEPS.map((step, i) => (
              <div key={step.value} className="flex flex-1 items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                    i <= stepIdx
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </div>
                <div className="text-sm">{step.label}</div>
                {i < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      'h-px flex-1',
                      i < stepIdx ? 'bg-emerald-300' : 'bg-muted',
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
            <div>{s.customer?.name ?? '—'}</div>
            <div className="text-muted-foreground">Утас</div>
            <div>{s.customer?.contactPhone ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Дэлгэрэнгүй</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Жин</div>
            <div>{formatNumber(s.weightKg)} кг</div>
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
        vehiclePlate={s.vehiclePlate ?? null}
        driverName={s.driverName ?? null}
        driverPhone={s.driverPhone ?? null}
        serialNumber={s.serialNumber ?? null}
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

      <CargoManifest
        shipmentId={id}
        status={s.status ?? ''}
        entries={compact(s.cargoEntries).map((e) => ({
          id: e.id!,
          productLabel: e.productLabel ?? '—',
          pieceCount:
            e.pieceCount != null ? Number(e.pieceCount) : null,
          grossKg: e.grossKg != null ? Number(e.grossKg) : null,
          tareKg: e.tareKg != null ? Number(e.tareKg) : null,
          weightKg: Number(e.weightKg ?? 0),
          pricePerKg: e.pricePerKg != null ? Number(e.pricePerKg) : null,
          sequenceNo: Number(e.sequenceNo ?? 0),
          createdBy: e.createdBy?.param ?? null,
        }))}
        onChanged={refetch}
      />

      {s.salesTransaction ? (
        <Card>
          <CardHeader>
            <CardTitle>Холбоотой гүйлгээ</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Код</div>
            <div className="font-mono">{s.salesTransaction.transactionCode}</div>
            <div className="text-muted-foreground">Дүн</div>
            <div>{formatMNT(s.salesTransaction.amount)}</div>
            <div className="text-muted-foreground">Төлбөр</div>
            <div>
              {PAYMENT_STATUS_MN[s.salesTransaction.paymentStatus ?? ''] ??
                s.salesTransaction.paymentStatus}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ─── Loading info editor (driver, serial, vehicle plate) ────────────
//
// One card that captures everything the storekeeper notes from the truck:
// vehicle plate, driver name + phone, paper serial number. All four flush
// in a single mutation so the storekeeper can fill them on a tablet quickly.

function LoadingInfoEditor({
  shipmentId,
  vehiclePlate,
  driverName,
  driverPhone,
  serialNumber,
  onChanged,
}: {
  shipmentId: string;
  vehiclePlate: string | null;
  driverName: string | null;
  driverPhone: string | null;
  serialNumber: string | null;
  onChanged: () => void;
}) {
  const [plate, setPlate] = useState(vehiclePlate ?? '');
  const [name, setName] = useState(driverName ?? '');
  const [phone, setPhone] = useState(driverPhone ?? '');
  const [serial, setSerial] = useState(serialNumber ?? '');
  const [save, { loading }] = useMutation(UpdateShipmentLoadingInfoDoc);

  const dirty =
    (plate.trim() || null) !== (vehiclePlate ?? null) ||
    (name.trim() || null) !== (driverName ?? null) ||
    (phone.trim() || null) !== (driverPhone ?? null) ||
    (serial.trim() || null) !== (serialNumber ?? null);

  async function onSave() {
    try {
      const r = await save({
        variables: {
          id: shipmentId,
          vehiclePlate: plate.trim() || null,
          driverName: name.trim() || null,
          driverPhone: phone.trim() || null,
          serialNumber: serial.trim() || null,
        },
      });
      unwrap(r.data?.updateShipmentLoadingInfo);
      toast.success('Хадгалагдлаа');
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ачилтын мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Машины дугаар</Label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="ж: Лиаз 134467"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Серийн дугаар</Label>
            <Input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="ж: 0024781"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Жолоочийн нэр</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Овог нэр"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Жолоочийн утас</Label>
            <Input
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ж: 9911 2233"
              className="h-11"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={loading || !dirty}>
            {loading ? '...' : 'Хадгалах'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Shipment photo gallery (multi-image attachments) ────────────────
//
// Storekeeper attaches the truck-side / cargo-doors / driver licence / paper
// serial photos here. Each upload posts to /api/file-upload then attaches
// the returned file id via addShipmentPhoto. Photos are ordered by sequenceNo.

type ShipmentPhotoRow = {
  id: string;
  sequenceNo: number;
  createdAt: string | null;
  fileId: string | null;
  url: string | null;
};

function ShipmentPhotoGallery({
  shipmentId,
  photos,
  onChanged,
}: {
  shipmentId: string;
  photos: ShipmentPhotoRow[];
  onChanged: () => void;
}) {
  const [uploadValue, setUploadValue] = useState<string | null>(null);
  const [attach] = useMutation(AddShipmentPhotoDoc);
  const [remove] = useMutation(RemoveShipmentPhotoDoc);

  const ordered = useMemo(
    () => [...photos].sort((a, b) => a.sequenceNo - b.sequenceNo),
    [photos],
  );

  async function onUploaded(fileId: string | null) {
    if (!fileId) return;
    try {
      const r = await attach({ variables: { shipmentId, fileId } });
      unwrap(r.data?.addShipmentPhoto);
      setUploadValue(null);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onRemove(id: string) {
    if (!confirm('Энэ зургийг устгах уу?')) return;
    try {
      const r = await remove({ variables: { id } });
      unwrap(r.data?.removeShipmentPhoto);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Ачилтын зургууд</CardTitle>
        <Badge className="border-0 bg-primary/10 text-primary tabular-nums">
          {ordered.length} зураг
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <PhotoUpload
          value={uploadValue}
          onChange={(fid) => {
            setUploadValue(fid);
            if (fid) onUploaded(fid);
          }}
          type="shipment"
          label="Шинэ зураг нэмэх"
          capture="environment"
        />

        {ordered.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Зураг алга. Дээрх товчоор машины, серийн дугаар, жолоочийн зургаа
            нэмнэ үү.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ordered.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-md border bg-muted/20"
              >
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt={`Зураг #${p.sequenceNo}`}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center text-xs text-muted-foreground">
                    Файл алга
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-2 py-1 text-xs text-white">
                  <span className="tabular-nums">#{p.sequenceNo}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    className="rounded px-1.5 py-0.5 hover:bg-white/15"
                  >
                    Устгах
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Cargo manifest v2 ───────────────────────────────────────────────
//
// Mirrors the storekeeper's notebook layout — one row per load with:
//   #  · ш (pieces) · Бохир жин · Тара жин · Цэвэр жин (computed)
// Rows are grouped by productLabel; each group shows piece + net totals;
// a grand total line at the bottom matches "Нийт 935ш = 25,591 кг".
// Net is computed live from gross−tare; if the storekeeper has only the
// net figure handy, leaving gross+tare blank still works.

type CargoRow = {
  id: string;
  productLabel: string;
  pieceCount: number | null;
  grossKg: number | null;
  tareKg: number | null;
  weightKg: number;
  // Buyer-side price agreed at loading. May be null until the buyer commits.
  pricePerKg: number | null;
  sequenceNo: number;
  createdBy: string | null;
};

function CargoManifest({
  shipmentId,
  status,
  entries,
  onChanged,
}: {
  shipmentId: string;
  status: string;
  entries: CargoRow[];
  onChanged: () => void;
}) {
  const [addEntry, { loading: adding }] = useMutation(AddCargoEntryDoc);
  const [removeEntry] = useMutation(DeleteCargoEntryDoc);
  const [updatePrice] = useMutation(UpdateCargoEntryPriceDoc);
  const [label, setLabel] = useState('');
  const [pieces, setPieces] = useState('');
  const [gross, setGross] = useState('');
  const [tare, setTare] = useState('');
  const [price, setPrice] = useState('');

  // Live net preview from gross − tare (so the user sees what'll be saved).
  const previewNet = useMemo(() => {
    const g = Number(gross);
    const t = Number(tare);
    if (
      Number.isFinite(g) &&
      g > 0 &&
      Number.isFinite(t) &&
      t >= 0 &&
      t < g
    ) {
      return Number((g - t).toFixed(2));
    }
    return null;
  }, [gross, tare]);

  const editable = status !== 'DELIVERED';

  // Group by productLabel, preserve insertion order, compute per-group
  // sums of pieces + net weight.
  const grouped = useMemo(() => {
    const m = new Map<string, CargoRow[]>();
    const order: string[] = [];
    for (const e of [...entries].sort(
      (a, b) => a.sequenceNo - b.sequenceNo,
    )) {
      if (!m.has(e.productLabel)) {
        m.set(e.productLabel, []);
        order.push(e.productLabel);
      }
      m.get(e.productLabel)!.push(e);
    }
    return order.map((lbl) => {
      const rows = m.get(lbl)!;
      const weightSubtotal = rows.reduce((s, r) => s + r.weightKg, 0);
      const amountSubtotal = rows.reduce(
        (s, r) => s + (r.pricePerKg != null ? r.weightKg * r.pricePerKg : 0),
        0,
      );
      // Weighted avg ₮/kg over the priced rows only — gives the buyer-facing
      // "average price for this whole-carcass type". Unpriced rows excluded.
      const pricedWeight = rows.reduce(
        (s, r) => s + (r.pricePerKg != null ? r.weightKg : 0),
        0,
      );
      const avgPrice = pricedWeight > 0 ? amountSubtotal / pricedWeight : null;
      return {
        productLabel: lbl,
        rows,
        pieceSubtotal: rows.reduce((s, r) => s + (r.pieceCount ?? 0), 0),
        weightSubtotal,
        amountSubtotal,
        avgPrice,
        unpricedRows: rows.filter((r) => r.pricePerKg == null).length,
      };
    });
  }, [entries]);

  const knownLabels = useMemo(
    () => Array.from(new Set(grouped.map((g) => g.productLabel))),
    [grouped],
  );

  const grandPieces = grouped.reduce((s, g) => s + g.pieceSubtotal, 0);
  const grandWeight = grouped.reduce((s, g) => s + g.weightSubtotal, 0);
  const grandAmount = grouped.reduce((s, g) => s + g.amountSubtotal, 0);
  const grandUnpriced = grouped.reduce((s, g) => s + g.unpricedRows, 0);

  async function onAdd() {
    const lbl = label.trim();
    if (!lbl) {
      toast.error('Барааны нэр оруулна уу');
      return;
    }
    const pcs = pieces.trim() ? Number(pieces) : null;
    const g = gross.trim() ? Number(gross) : null;
    const t = tare.trim() ? Number(tare) : null;
    const haveGrossTare = g != null && t != null;
    if (!haveGrossTare && previewNet == null) {
      toast.error('Бохир + Тара эсвэл цэвэр жин оруулна уу');
      return;
    }
    const priceTrim = price.trim();
    const priceNum = priceTrim ? Number(priceTrim) : null;
    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      toast.error('Үнэ сөрөг байж болохгүй');
      return;
    }
    try {
      const r = await addEntry({
        variables: {
          shipmentId,
          productLabel: lbl,
          pieceCount: pcs,
          grossKg: g,
          tareKg: t,
          // Send net only when gross/tare aren't supplied — BE prefers
          // gross-minus-tare when both are present.
          weightKg: haveGrossTare ? null : previewNet,
          pricePerKg: priceNum,
        },
      });
      unwrap(r.data?.addCargoEntry);
      // Clear the weight + pieces fields but keep the label sticky so
      // multi-row entry for the same product is one-handed. Price is also
      // sticky — the storekeeper usually loads several rows at one agreed
      // ₮/kg figure, so don't force them to re-type it.
      setPieces('');
      setGross('');
      setTare('');
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onPriceSave(id: string, raw: string) {
    const trimmed = raw.trim();
    const next = trimmed ? Number(trimmed) : null;
    if (next != null && (!Number.isFinite(next) || next < 0)) {
      toast.error('Үнэ сөрөг байж болохгүй');
      return;
    }
    try {
      const r = await updatePrice({
        variables: { id, pricePerKg: next },
      });
      unwrap(r.data?.updateCargoEntryPrice);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onRemove(id: string) {
    if (!confirm('Энэ мөрийг устгах уу?')) return;
    try {
      const r = await removeEntry({ variables: { id } });
      unwrap(r.data?.deleteCargoEntry);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Ачааны жагсаалт</CardTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="border-0 bg-primary/10 text-primary tabular-nums">
            Нийт {grandPieces}ш / {formatNumber(grandWeight)} кг
          </Badge>
          <Badge className="border-0 bg-emerald-100 text-emerald-800 tabular-nums">
            {formatMNT(grandAmount)}
          </Badge>
          {grandUnpriced > 0 ? (
            <Badge className="border-0 bg-amber-100 text-amber-800">
              Үнэ ороогүй {grandUnpriced}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Quick-add row matching the notebook column order ── */}
        {editable ? (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[2fr_repeat(4,minmax(0,1fr))_auto]">
              <div className="space-y-1.5">
                <Label className="text-xs">Бараа</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Адууны мах / Хацар мах ..."
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ш (тоо)</Label>
                <KeypadField
                  value={pieces}
                  onChange={setPieces}
                  label="ш (тоо)"
                  className="h-11 cursor-pointer text-right tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Бохир (кг)</Label>
                <KeypadField
                  value={gross}
                  onChange={setGross}
                  label="Бохир жин (кг)"
                  className="h-11 cursor-pointer text-right tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Тара (кг)</Label>
                <KeypadField
                  value={tare}
                  onChange={setTare}
                  label="Тара жин (кг)"
                  className="h-11 cursor-pointer text-right tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Үнэ (₮/кг)</Label>
                <KeypadField
                  value={price}
                  onChange={setPrice}
                  label="Үнэ (₮/кг)"
                  placeholder="заавал биш"
                  className="h-11 cursor-pointer text-right tabular-nums"
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="h-11 w-full"
                  onClick={onAdd}
                  disabled={adding}
                >
                  {adding ? '...' : 'Нэмэх'}
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Цэвэр жин:{' '}
              <span className="font-medium text-foreground tabular-nums">
                {previewNet != null ? `${formatNumber(previewNet)} кг` : '—'}
              </span>{' '}
              · Бохир − Тара. Зөвхөн цэвэр жинтэй бол Бохир/Тара хоосон үлдээ
              ба Тара талбарт цэвэр жинг бичээрэй. Үнэ нь ачилтын дараа
              тохиролцсон ₮/кг.
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Ачилт хүргэгдсэн тул жагсаалтыг өөрчлөх боломжгүй.
          </div>
        )}

        {/* ── Quick-pick chips ── */}
        {editable && knownLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {knownLabels.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setLabel(k)}
                className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs hover:bg-muted"
              >
                {k}
              </button>
            ))}
          </div>
        ) : null}

        {/* ── Grouped tables ── */}
        {grouped.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Мөр алга. Дээрх талбараас бараа + жин оруулна уу.
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((g) => (
              <div key={g.productLabel} className="rounded-md border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
                  <div className="text-sm font-semibold">{g.productLabel}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className="border bg-background text-foreground tabular-nums">
                      Нийт {g.pieceSubtotal}ш /{' '}
                      {formatNumber(g.weightSubtotal)} кг
                    </Badge>
                    {g.avgPrice != null ? (
                      <Badge className="border-0 bg-sky-100 text-sky-800 tabular-nums">
                        Дунд. {formatNumber(g.avgPrice)} ₮/кг
                      </Badge>
                    ) : null}
                    <Badge className="border-0 bg-primary/10 text-primary tabular-nums">
                      {formatMNT(g.amountSubtotal)}
                    </Badge>
                    {g.unpricedRows > 0 ? (
                      <Badge className="border-0 bg-amber-100 text-amber-800">
                        Үнэ ороогүй {g.unpricedRows}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="text-right">ш</TableHead>
                      <TableHead className="text-right">Бохир</TableHead>
                      <TableHead className="text-right">Тара</TableHead>
                      <TableHead className="text-right">Цэвэр</TableHead>
                      <TableHead className="text-right">Үнэ ₮/кг</TableHead>
                      <TableHead className="text-right">Дүн ₮</TableHead>
                      <TableHead>Жинч</TableHead>
                      {editable ? <TableHead /> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.rows.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.pieceCount ?? '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.grossKg != null ? formatNumber(r.grossKg) : '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.tareKg != null ? formatNumber(r.tareKg) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatNumber(r.weightKg)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {editable ? (
                            <PriceCell
                              value={r.pricePerKg}
                              onSave={(next) => onPriceSave(r.id, next)}
                            />
                          ) : r.pricePerKg != null ? (
                            formatNumber(r.pricePerKg)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {r.pricePerKg != null
                            ? formatMNT(r.weightKg * r.pricePerKg)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.createdBy ?? '—'}
                        </TableCell>
                        {editable ? (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemove(r.id)}
                            >
                              Устгах
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 rounded-md border-2 px-3 py-2',
            grandWeight > 0
              ? 'border-primary/40 bg-primary/5'
              : 'border-muted bg-muted/20',
          )}
        >
          <span className="text-base font-semibold">Ерөнхий нийт</span>
          <span className="text-base font-semibold tabular-nums">
            {grandPieces}ш = {formatNumber(grandWeight)} кг ·{' '}
            {formatMNT(grandAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline ₮/kg price editor — switches between a button-toggle display and an
// Input with Save/Cancel. Empty input clears the price back to null.
function PriceCell({
  value,
  onSave,
}: {
  value: number | null;
  onSave: (raw: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value != null ? String(value) : '');

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value != null ? String(value) : '');
          setEditing(true);
        }}
        className="font-mono tabular-nums hover:underline"
      >
        {value != null ? (
          formatNumber(value)
        ) : (
          <span className="text-muted-foreground">— нэмэх</span>
        )}
      </button>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Input
        autoFocus
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-8 w-24 text-right tabular-nums"
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={async () => {
          await onSave(draft);
          setEditing(false);
        }}
      >
        ✓
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setEditing(false)}
      >
        ✕
      </Button>
    </div>
  );
}
