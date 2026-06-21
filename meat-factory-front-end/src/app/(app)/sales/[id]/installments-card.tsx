'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AddSalesInstallmentDoc,
  RemoveSalesInstallmentDoc,
} from '@/lib/queries/sales';
import { unwrap } from '@/lib/unwrap';
import { formatMNT } from '@/lib/format/money';
import { fmtDate } from '@/lib/format/date';

export type InstallmentRow = {
  id: string;
  amountMnt: number;
  paidAt: string;
  notes: string | null;
  createdBy: string | null;
};

// Partial-payment manifest for one sales transaction. Each row records a
// 3M+4M+4M-style instalment. Outstanding live-computes from rows + amount.
export function InstallmentsCard({
  txId,
  amount,
  installments,
}: {
  txId: string;
  amount: number;
  installments: InstallmentRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addInstallment, { loading: adding }] = useMutation(
    AddSalesInstallmentDoc,
  );
  const [removeInstallment] = useMutation(RemoveSalesInstallmentDoc);
  const [amt, setAmt] = useState('');
  const [paidAt, setPaidAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState('');

  const paidSum = installments.reduce((s, r) => s + r.amountMnt, 0);
  const outstanding = Math.max(0, amount - paidSum);

  async function onAdd() {
    const n = Number(amt);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Дүн эерэг тоо байх ёстой');
      return;
    }
    if (n > outstanding + 0.01) {
      toast.error('Үлдэгдэлээс илүү дүн оруулсан байна');
      return;
    }
    try {
      const r = await addInstallment({
        variables: {
          salesTransactionId: txId,
          amountMnt: n,
          paidAt: paidAt ? new Date(paidAt).toISOString() : null,
          notes: notes.trim() || null,
        },
      });
      unwrap(r.data?.addSalesInstallment);
      toast.success('Хадгалагдлаа');
      setAmt('');
      setNotes('');
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onRemove(id: string) {
    if (!confirm('Энэ төлбөрийг устгах уу?')) return;
    try {
      const r = await removeInstallment({ variables: { id } });
      unwrap(r.data?.removeSalesInstallment);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Хэсэгчилсэн төлбөр</CardTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="border-0 bg-emerald-100 text-emerald-800 tabular-nums">
            Төлсөн: {formatMNT(paidSum)}
          </Badge>
          <Badge
            className={
              outstanding > 0
                ? 'border-0 bg-amber-100 text-amber-800 tabular-nums'
                : 'border-0 bg-emerald-100 text-emerald-800 tabular-nums'
            }
          >
            Үлдэгдэл: {formatMNT(outstanding)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {outstanding > 0 ? (
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs">Дүн (₮)</Label>
              <Input
                inputMode="decimal"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                className="h-11 text-right tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Огноо</Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Тэмдэглэл</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="заавал биш"
                className="h-11"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={onAdd}
                disabled={adding || pending}
                className="h-11"
              >
                {adding ? '...' : 'Нэмэх'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Бүх төлбөр хийгдсэн.
          </div>
        )}

        {installments.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Хэсэгчилсэн төлбөр алга
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead className="text-right">Дүн</TableHead>
                <TableHead>Тэмдэглэл</TableHead>
                <TableHead>Бүртгэсэн</TableHead>
                <TableHead className="text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{fmtDate(r.paidAt)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMNT(r.amountMnt)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.notes ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.createdBy ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemove(r.id)}
                    >
                      Устгах
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
