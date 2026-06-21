'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerListDoc } from '@/lib/queries/customer';
import { SalesListDoc } from '@/lib/queries/sales';
import { CreateShipmentDoc } from '@/lib/queries/shipment';
import { InventoryStatsDoc } from '@/lib/queries/inventory';
import { unwrap } from '@/lib/unwrap';
import { compact } from '@/lib/compact';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { formatMNT, formatNumber } from '@/lib/format/money';
import { PAYMENT_STATUS_MN } from '@/lib/format/enum';

// A shipment is the physical stock-out event. It MUST be tied to either:
//   • a sales transaction (the commercial paper — implies the customer), OR
//   • a customer directly (rare "ad-hoc" path with no formal order).
// Mixing both at once was confusing and the old form's parallel dropdowns
// made the relationship ambiguous. The new form forces one mode at a time
// via a Tabs control, shows a summary panel for the chosen sales tx, and
// honours `?prefillWeightKg=…` from the inventory page shortcut.
type Mode = 'sale' | 'adhoc';

export function NewShipmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get('prefillWeightKg');

  const { data: cd } = useQuery(CustomerListDoc, {
    variables: {
      isActive: true,
      kind: null,
      limit: 100,
      page: 1,
      search: null,
    },
  });
  const { data: sd } = useQuery(SalesListDoc, {
    variables: {
      limit: 50,
      page: 1,
      paymentStatus: null,
      customerId: null,
      dateRange: null,
    },
  });
  // Show live meat-on-hand so the user can sanity-check the requested weight.
  const { data: stats } = useQuery(InventoryStatsDoc, {
    fetchPolicy: 'cache-and-network',
  });
  const [createShipment] = useMutation(CreateShipmentDoc);

  const customers = compact(cd?.customers?.customers);
  const sales = compact(sd?.salesTransactions?.salesTransactions);

  const [mode, setMode] = useState<Mode>('sale');
  const [customerId, setCustomerId] = useState<string>('');
  const [salesTransactionId, setSalesTransactionId] = useState<string>('');
  // Honour the inventory page's `?prefillWeightKg=…` shortcut on first mount.
  const [weightKg, setWeightKg] = useState(() => {
    const n = Number(prefill);
    return Number.isFinite(n) && n > 0 ? String(n) : '';
  });
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Summary panel for the chosen sale.
  const selectedSale = useMemo(
    () => sales.find((s) => s.id === salesTransactionId) ?? null,
    [sales, salesTransactionId],
  );

  // Switching modes wipes the OTHER mode's selection so we never submit both.
  function setModeTo(next: Mode) {
    setMode(next);
    if (next === 'sale') setCustomerId('');
    else setSalesTransactionId('');
  }

  async function onSubmit() {
    if (mode === 'sale' && !salesTransactionId) {
      toast.error('Гүйлгээ сонгоно уу');
      return;
    }
    if (mode === 'adhoc' && !customerId) {
      toast.error('Харилцагч сонгоно уу');
      return;
    }
    const w = Number(weightKg);
    if (!w || w <= 0) {
      toast.error('Жин эерэг тоо');
      return;
    }
    setBusy(true);
    try {
      const r = await createShipment({
        variables: {
          customerId: mode === 'adhoc' ? customerId : null,
          salesTransactionId: mode === 'sale' ? salesTransactionId : null,
          weightKg: w,
          vehiclePlate: vehiclePlate.trim() || null,
          driverName: driverName.trim() || null,
          driverPhone: driverPhone.trim() || null,
          serialNumber: serialNumber.trim() || null,
          notes: notes.trim() || null,
          photoFileId: photoFileId ?? null,
        },
      });
      const sh = unwrap(r.data?.createShipment).shipment;
      if (!sh?.id) throw new Error('Хариу буцаасангүй');
      toast.success(`Ачилт ${sh.shipmentCode} үүсгэгдлээ`);
      router.push(`/shipments/${sh.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const meatOnHand = Number(stats?.inventoryStats?.stats?.meatStockKg ?? 0);

  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        {/* Mode tabs — exactly one path is active at a time. */}
        <Tabs value={mode} onValueChange={(v) => setModeTo(v as Mode)}>
          <TabsList>
            <TabsTrigger value="sale">Гүйлгээтэй ачилт</TabsTrigger>
            <TabsTrigger value="adhoc">Гүйлгээгүй (ad-hoc)</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'sale' ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Гүйлгээ</Label>
              <Select
                value={salesTransactionId || undefined}
                onValueChange={(v) => setSalesTransactionId(v ?? '')}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Гүйлгээ сонгоно уу" />
                </SelectTrigger>
                <SelectContent>
                  {sales.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Гүйлгээ алга — эхлээд «Гүйлгээ» цэснээс үүсгэнэ үү.
                    </div>
                  ) : (
                    sales.map((s) => (
                      <SelectItem key={s.id!} value={s.id!}>
                        {s.transactionCode} — {s.customer?.name ?? '—'} ·{' '}
                        {formatMNT(s.amount)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedSale ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Сонгосон гүйлгээ
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="text-muted-foreground">Код</div>
                  <div className="font-mono">{selectedSale.transactionCode}</div>
                  <div className="text-muted-foreground">Харилцагч</div>
                  <div>{selectedSale.customer?.name ?? '—'}</div>
                  <div className="text-muted-foreground">Захиалсан жин</div>
                  <div>
                    {selectedSale.totalWeightKg != null
                      ? `${formatNumber(selectedSale.totalWeightKg)} кг`
                      : '—'}
                  </div>
                  <div className="text-muted-foreground">Үнэ</div>
                  <div>{formatMNT(selectedSale.amount)}</div>
                  <div className="text-muted-foreground">Төлбөр</div>
                  <div>
                    {PAYMENT_STATUS_MN[selectedSale.paymentStatus ?? ''] ??
                      selectedSale.paymentStatus}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Харилцагч</Label>
            <Select
              value={customerId || undefined}
              onValueChange={(v) => setCustomerId(v ?? '')}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Харилцагч сонгоно уу" />
              </SelectTrigger>
              <SelectContent>
                {customers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Харилцагч алга
                  </div>
                ) : (
                  customers.map((c) => (
                    <SelectItem key={c.id!} value={c.id!}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Гүйлгээгүй ачилт нь тооцооны баримтаар бус, шууд харилцагчид
              хүргэсэн нөөцийн хөдөлгөөн.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Жин (кг)</Label>
          <Input
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="h-11 max-w-xs text-right text-base tabular-nums"
          />
          <p className="text-xs text-muted-foreground">
            Махны нөөц гарт:{' '}
            <span className="font-medium text-foreground">
              {formatNumber(meatOnHand)} кг
            </span>
            {prefill ? ' · урьдчилан тооцсон утга бөглөгдсөн' : ''}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Машины дугаар</Label>
            <Input
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              placeholder="ж: Лиаз 134467"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Серийн дугаар</Label>
            <Input
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="ж: 0024781"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Жолоочийн нэр</Label>
            <Input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Овог нэр"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Жолоочийн утас</Label>
            <Input
              inputMode="tel"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="ж: 9911 2233"
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Тэмдэглэл</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <div className="max-w-md">
          <PhotoUpload
            value={photoFileId}
            onChange={setPhotoFileId}
            type="shipment"
            label="Ачилтын зураг (заавал биш)"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={busy}>
            {busy ? '...' : 'Үүсгэх'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
