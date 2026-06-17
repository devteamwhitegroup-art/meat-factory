'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DeleteMonthlyBudgetDoc,
  MonthlyBudgetsDoc,
  UpsertMonthlyBudgetDoc,
} from '@/lib/queries/monthly-budget';
import { compact } from '@/lib/compact';
import { unwrap } from '@/lib/unwrap';
import { formatMNT } from '@/lib/format/money';

const MN_MONTH = [
  '1 сар',
  '2 сар',
  '3 сар',
  '4 сар',
  '5 сар',
  '6 сар',
  '7 сар',
  '8 сар',
  '9 сар',
  '10 сар',
  '11 сар',
  '12 сар',
];

export function MonthlyBudgetsClient() {
  const { data, refetch } = useQuery(MonthlyBudgetsDoc, {
    fetchPolicy: 'cache-and-network',
  });
  const [upsert, { loading: saving }] = useMutation(UpsertMonthlyBudgetDoc);
  const [remove] = useMutation(DeleteMonthlyBudgetDoc);

  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(String(today.getFullYear()));
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const budgets = compact(data?.monthlyBudgets?.budgets);

  async function onSave() {
    const y = Number(year);
    const m = Number(month);
    const a = Number(amount);
    if (!Number.isFinite(y) || y < 2000) {
      toast.error('Жил буруу байна');
      return;
    }
    if (!Number.isFinite(m) || m < 1 || m > 12) {
      toast.error('Сар 1-12 хооронд байх ёстой');
      return;
    }
    if (!Number.isFinite(a) || a < 0) {
      toast.error('Дүн сөрөг байж болохгүй');
      return;
    }
    try {
      const r = await upsert({
        variables: {
          year: y,
          month: m,
          amountMnt: a,
          notes: notes.trim() || null,
        },
      });
      unwrap(r.data?.upsertMonthlyBudget);
      toast.success('Хадгалагдлаа');
      setAmount('');
      setNotes('');
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Устгах уу?')) return;
    try {
      const r = await remove({ variables: { id } });
      unwrap(r.data?.deleteMonthlyBudget);
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function onEdit(b: (typeof budgets)[number]) {
    setYear(String(b.year ?? today.getFullYear()));
    setMonth(String(b.month ?? today.getMonth() + 1));
    setAmount(String(b.amountMnt ?? ''));
    setNotes(b.notes ?? '');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Сар сонгож төсөв оруулах</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs">Жил</Label>
              <Input
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Сар (1-12)</Label>
              <Input
                inputMode="numeric"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Дүн (₮)</Label>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 text-right tabular-nums"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={onSave} disabled={saving} className="h-11">
                {saving ? '...' : 'Хадгалах'}
              </Button>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label className="text-xs">Тэмдэглэл (заавал биш)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бүртгэгдсэн төсөв</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Төсөв алга
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сар</TableHead>
                  <TableHead className="text-right">Дүн</TableHead>
                  <TableHead>Тэмдэглэл</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((b) => (
                  <TableRow key={b.id!}>
                    <TableCell>
                      {b.year} {MN_MONTH[(b.month ?? 1) - 1]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMNT(b.amountMnt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.notes ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(b)}
                      >
                        Засах
                      </Button>{' '}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(b.id!)}
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
    </div>
  );
}
