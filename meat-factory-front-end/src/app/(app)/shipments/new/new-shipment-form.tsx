'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { unwrap } from '@/lib/unwrap';
import { compact } from '@/lib/compact';
import { PhotoUpload } from '@/components/common/PhotoUpload';

export function NewShipmentForm() {
  const router = useRouter();
  const { data: cd } = useQuery(CustomerListDoc, {
    variables: { isActive: true, limit: 100, page: 1, search: null },
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
  const [createShipment] = useMutation(CreateShipmentDoc);

  const customers = compact(cd?.customers?.customers);
  const sales = compact(sd?.salesTransactions?.salesTransactions);

  const [customerId, setCustomerId] = useState('');
  const [salesTransactionId, setSalesTransactionId] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!customerId && !salesTransactionId) {
      toast.error('Харилцагч эсвэл гүйлгээ сонгоно уу');
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
          customerId: customerId || null,
          salesTransactionId: salesTransactionId || null,
          weightKg: w,
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

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-medium">Харилцагч</div>
            <Select
              value={customerId || undefined}
              onValueChange={(v) => setCustomerId(v ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="(заавал биш)" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id!} value={c.id!}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Гүйлгээ</div>
            <Select
              value={salesTransactionId || undefined}
              onValueChange={(v) => setSalesTransactionId(v ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="(заавал биш)" />
              </SelectTrigger>
              <SelectContent>
                {sales.map((s) => (
                  <SelectItem key={s.id!} value={s.id!}>
                    {s.transactionCode} — {s.customer?.name ?? ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm font-medium">Жин (кг)</div>
          <Input
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium">Тэмдэглэл</div>
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
