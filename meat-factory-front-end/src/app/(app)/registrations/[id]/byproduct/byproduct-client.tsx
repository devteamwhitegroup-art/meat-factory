'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'urql';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BYPRODUCT_MN, BYPRODUCT_TYPES } from '@/lib/format/enum';
import { fmtDateTime } from '@/lib/format/date';
import { formatNumber } from '@/lib/format/money';
import { StatusBadge } from '@/components/registration/StatusBadge';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AddByproductLogDoc,
  RegistrationDetailDoc,
} from '@/lib/queries/registration';
import { unwrap } from '@/lib/urql/unwrap';
import { compact } from '@/lib/compact';

type Row = { count: string; avg: string };

export function ByproductClient({ id }: { id: string }) {
  const router = useRouter();
  const [{ data, fetching }, refetch] = useQuery({
    query: RegistrationDetailDoc,
    variables: { id },
    requestPolicy: 'cache-and-network',
  });
  const [, addLog] = useMutation(AddByproductLogDoc);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (fetching && !data) {
    return <Skeleton className="h-72 w-full" />;
  }
  const reg = data?.registration?.registration;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  async function submit(t: string) {
    const r = rows[t] ?? { count: '', avg: '' };
    const c = Number(r.count);
    const a = Number(r.avg);
    if (!c || c <= 0) {
      toast.error('Тоог оруулна уу');
      return;
    }
    if (!a || a <= 0) {
      toast.error('Дундаж жинг оруулна уу');
      return;
    }
    setBusy(t);
    try {
      const res = await addLog({
        registrationId: id,
        byproductType: t as never,
        count: c,
        averageWeightKg: a,
        photoFileId: photoFileId ?? null,
      });
      unwrap(res.data?.addByproductLog);
      toast.success('Бүртгэгдлээ');
      setRows((s) => ({ ...s, [t]: { count: '', avg: '' } }));
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Бүртгэлийн дугаар</div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">#{reg.registrationNumber}</h1>
            <StatusBadge status={reg.status} />
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push(`/registrations/${id}/verify`)}>
          Дараах: Баталгаажуулалт →
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Дайвар бүртгэх (ширхэг + дундаж жин)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-md">
            <PhotoUpload
              value={photoFileId}
              onChange={setPhotoFileId}
              type="byproduct"
              label="Зураг (бүх мөрөнд хадгална, заавал биш)"
            />
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2">Төрөл</th>
                <th className="pb-2 w-28">Тоо</th>
                <th className="pb-2 w-32">Дундаж жин (кг)</th>
                <th className="pb-2 w-32">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {BYPRODUCT_TYPES.map((t) => {
                const row = rows[t] ?? { count: '', avg: '' };
                return (
                  <tr key={t} className="border-t">
                    <td className="py-2">{BYPRODUCT_MN[t] ?? t}</td>
                    <td className="py-2">
                      <Input
                        inputMode="numeric"
                        value={row.count}
                        onChange={(e) =>
                          setRows((s) => ({
                            ...s,
                            [t]: { ...row, count: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        inputMode="decimal"
                        value={row.avg}
                        onChange={(e) =>
                          setRows((s) => ({
                            ...s,
                            [t]: { ...row, avg: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <Button
                        size="sm"
                        disabled={
                          busy === t || reg.status !== 'WEIGHED'
                        }
                        onClick={() => submit(t)}
                      >
                        {busy === t ? '...' : 'Бүртгэх'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бүртгэгдсэн</CardTitle>
        </CardHeader>
        <CardContent>
          {compact(reg.byproductLogs).length === 0 ? (
            <div className="text-sm text-muted-foreground">Бичлэг алга</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Тоо</TableHead>
                  <TableHead>Дундаж</TableHead>
                  <TableHead>Нийт жин</TableHead>
                  <TableHead>Нярав</TableHead>
                  <TableHead>Цаг</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compact(reg.byproductLogs).map((b) => (
                  <TableRow key={b.id!}>
                    <TableCell>
                      {BYPRODUCT_MN[b.byproductType ?? ''] ?? b.byproductType}
                    </TableCell>
                    <TableCell>{b.count}</TableCell>
                    <TableCell>{formatNumber(b.averageWeightKg)}</TableCell>
                    <TableCell>{formatNumber(b.totalWeightKg)}</TableCell>
                    <TableCell>{b.loggedBy?.param ?? '—'}</TableCell>
                    <TableCell>{fmtDateTime(b.createdAt)}</TableCell>
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
