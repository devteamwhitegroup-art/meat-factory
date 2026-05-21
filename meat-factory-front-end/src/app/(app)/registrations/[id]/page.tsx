import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/registration/StatusBadge';
import { getClient } from '@/lib/apollo/server';
import { RegistrationDetailDoc } from '@/lib/queries/registration';
import { ANIMAL_MN, BYPRODUCT_MN } from '@/lib/format/enum';
import { fmtDate, fmtDateTime } from '@/lib/format/date';
import { formatMNT, formatNumber } from '@/lib/format/money';
import { compact } from '@/lib/compact';

type Props = { params: Promise<{ id: string }> };

export default async function RegistrationDetailPage({ params }: Props) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: RegistrationDetailDoc,
    variables: { id },
  });
  const wrap = data?.registration;
  if (!wrap?.success || !wrap.registration) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        {wrap?.message ?? 'Бүртгэл олдсонгүй'}
      </div>
    );
  }
  const r = wrap.registration;
  const status = r.status ?? 'REGISTERED';
  const isOpen = status === 'REGISTERED' || status === 'WEIGHING';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Бүртгэлийн дугаар</div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">
              #{r.registrationNumber}
            </h1>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(status === 'REGISTERED' || status === 'WEIGHING') && (
            <Link href={`/registrations/${r.id}/weigh`} className={buttonVariants()}>
              Хэмжүүр
            </Link>
          )}
          {status === 'WEIGHED' && (
            <>
              <Link href={`/registrations/${r.id}/byproduct`} className={buttonVariants()}>
                Дайвар
              </Link>
              <Link
                href={`/registrations/${r.id}/verify`}
                className={buttonVariants({ variant: 'outline' })}
              >
                Баталгаажуулалт
              </Link>
            </>
          )}
          {(status === 'VERIFIED' || status === 'SETTLED') && (
            <Link href={`/registrations/${r.id}/settlement`} className={buttonVariants()}>
              Тооцоо
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Малчны мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Нэр</div>
            <div>{r.herder?.name ?? '—'}</div>
            <div className="text-muted-foreground">Регистрийн дугаар</div>
            <div>{r.herder?.registrationNo ?? '—'}</div>
            <div className="text-muted-foreground">Утас</div>
            <div>{r.herder?.phone ?? '—'}</div>
            <div className="text-muted-foreground">Малчны данс</div>
            <div>{r.herder?.bankAccount ?? '—'}</div>
            <div className="text-muted-foreground">Хаяг</div>
            <div>{r.herder?.address ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Бүртгэлийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Машины дугаар</div>
            <div>{r.vehicleNumber ?? '—'}</div>
            <div className="text-muted-foreground">Тамга</div>
            <div>{r.stamp ?? '—'}</div>
            <div className="text-muted-foreground">Он сар</div>
            <div>{fmtDate(r.intakeDate)}</div>
            <div className="text-muted-foreground">Харуул</div>
            <div>{r.guard?.param ?? '—'}</div>
            <div className="text-muted-foreground">Зураг</div>
            <div>
              {r.photo?.url ? (
                <a
                  href={r.photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Харах
                </a>
              ) : (
                '—'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Малын төрөл</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          {compact(r.animalLines).map((l) => (
            <div
              key={l.id!}
              className="rounded-md border px-3 py-1.5"
            >
              {ANIMAL_MN[l.animalType ?? ''] ?? l.animalType}: <b>{l.count}</b>
            </div>
          ))}
        </CardContent>
      </Card>

      {compact(r.weighingEntries).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Жингийн түүх</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Жин (кг)</TableHead>
                  <TableHead>Жинч</TableHead>
                  <TableHead>Цаг</TableHead>
                  <TableHead>Зураг</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...compact(r.weighingEntries)]
                  .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
                  .map((w) => (
                    <TableRow key={w.id!}>
                      <TableCell>{w.sequenceNo}</TableCell>
                      <TableCell>
                        {ANIMAL_MN[w.animalType ?? ''] ?? w.animalType}
                      </TableCell>
                      <TableCell>{formatNumber(w.weightKg)}</TableCell>
                      <TableCell>{w.scaleOperator?.param ?? '—'}</TableCell>
                      <TableCell>{fmtDateTime(w.createdAt)}</TableCell>
                      <TableCell>
                        {w.photo?.url ? (
                          <a
                            href={w.photo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            Харах
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {compact(r.byproductLogs).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Дайвар бүтээгдэхүүн</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Тоо</TableHead>
                  <TableHead>Дундаж жин</TableHead>
                  <TableHead>Нийт жин</TableHead>
                  <TableHead>Нярав</TableHead>
                  <TableHead>Зураг</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compact(r.byproductLogs).map((b) => (
                  <TableRow key={b.id!}>
                    <TableCell>
                      {BYPRODUCT_MN[b.byproductType ?? ''] ?? b.byproductType}
                    </TableCell>
                    <TableCell>{b.count}</TableCell>
                    <TableCell>{formatNumber(b.averageWeightKg)}</TableCell>
                    <TableCell>{formatNumber(b.totalWeightKg)}</TableCell>
                    <TableCell>{b.loggedBy?.param ?? '—'}</TableCell>
                    <TableCell>
                      {b.photo?.url ? (
                        <a
                          href={b.photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Харах
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {r.verification && (
        <Card>
          <CardHeader>
            <CardTitle>Баталгаажуулалт</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">1-р баталгаа</div>
              <div>
                {r.verification.firstVerifier?.param ?? '—'}{' '}
                {r.verification.firstVerifiedAt
                  ? `(${fmtDateTime(r.verification.firstVerifiedAt)})`
                  : ''}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">2-р баталгаа</div>
              <div>
                {r.verification.secondVerifier?.param ?? '—'}{' '}
                {r.verification.secondVerifiedAt
                  ? `(${fmtDateTime(r.verification.secondVerifiedAt)})`
                  : ''}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {r.settlement && (
        <Card>
          <CardHeader>
            <CardTitle>Тооцоо</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Хүлээн авсан</TableHead>
                  <TableHead>Үнэ/кг</TableHead>
                  <TableHead>Мах</TableHead>
                  <TableHead>Дайвар</TableHead>
                  <TableHead>Бой зардал</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compact(r.settlement.lines).map((l) => (
                  <TableRow key={l.id!}>
                    <TableCell>
                      {ANIMAL_MN[l.animalType ?? ''] ?? l.animalType}
                    </TableCell>
                    <TableCell>{formatNumber(l.receivedWeightKg)}</TableCell>
                    <TableCell>{formatMNT(l.pricePerKg)}</TableCell>
                    <TableCell>{formatMNT(l.meatAmount)}</TableCell>
                    <TableCell>{formatMNT(l.byproductAmount)}</TableCell>
                    <TableCell>{formatMNT(l.slaughterCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="text-muted-foreground">Нийт мах</div>
              <div className="text-right">
                {formatMNT(r.settlement.totalMeatAmount)}
              </div>
              <div className="text-muted-foreground">Нийт дайвар</div>
              <div className="text-right">
                {formatMNT(r.settlement.totalByproductAmount)}
              </div>
              <div className="text-muted-foreground">Нийт бой зардал</div>
              <div className="text-right">
                {formatMNT(r.settlement.totalSlaughterCost)}
              </div>
              <div className="font-medium">Нийт төлбөр (бой зардал хасахаас өмнө)</div>
              <div className="text-right font-medium">
                {formatMNT(r.settlement.grossAmount)}
              </div>
              <div className="text-base font-semibold">Цэвэр төлбөр</div>
              <div className="text-right text-base font-semibold">
                {formatMNT(r.settlement.netPayable)}
              </div>
              <div className="text-muted-foreground">Төлсөн эсэх</div>
              <div className="text-right">
                {r.settlement.isPaid
                  ? `Тийм (${fmtDateTime(r.settlement.paidAt)})`
                  : 'Үгүй'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && (
        <div className="text-xs text-muted-foreground">
          Цуцлах болон бусад үйлдлийг тус тусын дэлгэцээс хий.
        </div>
      )}
    </div>
  );
}
