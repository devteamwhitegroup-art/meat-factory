'use client';

import type { ResultOf } from '@graphql-typed-document-node/core';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RegistrationDetailDoc } from '@/lib/queries/registration';
import { ANIMAL_MN, PAYMENT_STATUS_MN } from '@/lib/format/enum';
import { formatMNT, formatNumber } from '@/lib/format/money';
import { fmtDateTime } from '@/lib/format/date';
import { compact } from '@/lib/compact';

// Derive the (deeply-nested) registration + settlement shapes straight from
// the query document, so the receipt always matches what the page fetches.
type Reg = NonNullable<
  NonNullable<ResultOf<typeof RegistrationDetailDoc>['registration']>['registration']
>;
type Settlement = NonNullable<Reg['settlement']>;

// Read-only settlement receipt (printable). The only action is "mark paid",
// delegated back to the parent which owns the mutation + busy state.
export function SettlementReceipt({
  reg,
  existing,
  busy,
  onMarkPaid,
}: {
  reg: Reg;
  existing: Settlement;
  busy: boolean;
  onMarkPaid: () => void;
}) {
  return (
    <section data-print="settlement">
      <div className="mb-3 flex justify-end print-hide">
        <Button variant="outline" onClick={() => window.print()}>
          Хэвлэх
        </Button>
      </div>
      <div className="hidden print:mb-4 print:block">
        <div className="text-2xl font-semibold">
          Тооцооны баримт — Бүртгэл #{reg.registrationNumber}
        </div>
        <div className="text-xs text-muted-foreground">
          Малчин: {reg.herder?.name ?? '—'} · Регистр:{' '}
          {reg.herder?.registrationNo ?? '—'} · Утас:{' '}
          {reg.herder?.phone ?? '—'}
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Тооцоо</CardTitle>
          <Badge
            className={
              existing.isPaid
                ? 'border-0 bg-emerald-100 text-emerald-800'
                : 'border-0 bg-amber-100 text-amber-800'
            }
          >
            {existing.isPaid
              ? PAYMENT_STATUS_MN.PAID
              : PAYMENT_STATUS_MN.PENDING}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Төрөл</TableHead>
                <TableHead>Хүлээн авсан</TableHead>
                <TableHead>Үнэ/кг</TableHead>
                <TableHead>Мах</TableHead>
                <TableHead>Бой зардал</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compact(existing.lines).map((l) => (
                <TableRow key={l.id!}>
                  <TableCell>
                    {ANIMAL_MN[l.animalType ?? ''] ?? l.animalType}
                  </TableCell>
                  <TableCell>{formatNumber(l.receivedWeightKg)}</TableCell>
                  <TableCell>{formatMNT(l.pricePerKg)}</TableCell>
                  <TableCell>{formatMNT(l.meatAmount)}</TableCell>
                  <TableCell>{formatMNT(l.slaughterCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator />
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="text-muted-foreground">Нийт мах</div>
            <div className="text-right">
              {formatMNT(existing.totalMeatAmount)}
            </div>
            <div className="text-muted-foreground">Бой зардал</div>
            <div className="text-right">
              {formatMNT(existing.totalSlaughterCost)}
            </div>
            <div className="font-medium">Нийт төлбөр</div>
            <div className="text-right font-medium">
              {formatMNT(existing.grossAmount)}
            </div>
            <div className="text-base font-semibold">Малчинд өгөх дүн</div>
            <div className="text-right text-base font-semibold">
              {formatMNT(existing.netPayable)}
            </div>
            {existing.isPaid ? (
              <>
                <div className="text-muted-foreground">Төлсөн</div>
                <div className="text-right">
                  {fmtDateTime(existing.paidAt)}
                </div>
              </>
            ) : null}
          </div>

          {/* Payout destination block — prints on the receipt so the
              herder sees exactly which account got the money. Falls
              back to the herder's stored bank info when no override
              was supplied. */}
          {(() => {
            const account =
              existing.payoutBankAccount ?? reg.herder?.bankAccount ?? null;
            const bank =
              existing.payoutBankName ?? reg.herder?.bankName ?? null;
            const holder =
              existing.payoutAccountHolderName ??
              reg.herder?.accountHolderName ??
              reg.herder?.name ??
              null;
            const overridden = !!(
              existing.payoutBankAccount ||
              existing.payoutBankName ||
              existing.payoutAccountHolderName
            );
            if (!account && !bank && !holder) return null;
            return (
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Шилжүүлэх данс
                  </span>
                  {overridden ? (
                    <Badge className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      Бусдын данс
                    </Badge>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                  {holder ? (
                    <>
                      <div className="text-muted-foreground">
                        Эзэмшигч
                      </div>
                      <div>{holder}</div>
                    </>
                  ) : null}
                  {bank ? (
                    <>
                      <div className="text-muted-foreground">Банк</div>
                      <div>{bank}</div>
                    </>
                  ) : null}
                  {account ? (
                    <>
                      <div className="text-muted-foreground">Данс</div>
                      <div className="font-mono">{account}</div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })()}

          {/* Per-entry weighing detail so the herder can audit how each
            animal's mah → meatAmount was priced. Grouped by animal type,
            numbering restarts per type. */}
          {(() => {
            const entries = compact(reg.weighingEntries);
            if (entries.length === 0) return null;
            // sort by sequenceNo, then assign per-type ordinal so the row
            // numbers mirror the registration detail page.
            const sorted = [...entries].sort(
              (a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0),
            );
            const perType: Record<string, number> = {};
            const ord: Record<string, number> = {};
            for (const w of sorted) {
              const t = w.animalType ?? '';
              perType[t] = (perType[t] ?? 0) + 1;
              if (w.id) ord[w.id] = perType[t];
            }
            // group by animal type for display, preserving sort order.
            const grouped = new Map<string, typeof sorted>();
            for (const w of sorted) {
              const t = w.animalType ?? '—';
              if (!grouped.has(t)) grouped.set(t, []);
              grouped.get(t)!.push(w);
            }
            return (
              <div className="space-y-3">
                <div className="text-sm font-semibold">
                  Жинлэлтийн дэлгэрэнгүй
                </div>
                {Array.from(grouped.entries()).map(([t, rows]) => {
                  let sub = 0;
                  return (
                    <div key={t} className="rounded-md border">
                      <div className="border-b bg-muted/30 px-3 py-1.5 text-xs font-medium">
                        {ANIMAL_MN[t] ?? t}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Жин (кг)</TableHead>
                            <TableHead>Үнэ/кг</TableHead>
                            <TableHead>Дүн</TableHead>
                            {/* Per-entry weigher — so SCALE staff can
                                audit their own name on the receipt. */}
                            <TableHead className="print-hide">
                              Жинч
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((w) => {
                            const wt = Number(w.weightKg ?? 0);
                            const p = Number(w.pricePerKg ?? 0);
                            const amount = wt * p;
                            sub += amount;
                            return (
                              <TableRow key={w.id!}>
                                <TableCell>
                                  {ord[w.id!] ?? w.sequenceNo}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {formatNumber(w.weightKg)}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {p > 0 ? formatMNT(p) : '—'}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {formatMNT(amount)}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground print-hide">
                                  {w.scaleOperator?.param ?? '—'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <div className="flex justify-between border-t px-3 py-1.5 text-xs font-medium">
                        <span>{ANIMAL_MN[t] ?? t} нийт</span>
                        <span className="tabular-nums">
                          {formatMNT(sub)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {!existing.isPaid && reg.status === 'PAYMENT_PENDING' ? (
            <Button
              onClick={onMarkPaid}
              disabled={busy}
              className="w-full print-hide"
            >
              {busy ? '...' : 'Төлбөр төлсөнд тэмдэглэх'}
            </Button>
          ) : null}
          <div className="mt-4 hidden grid-cols-2 gap-x-8 gap-y-10 print:grid">
            <div className="border-t border-foreground/40 pt-2 text-xs text-muted-foreground">
              Малчны гарын үсэг
            </div>
            <div className="border-t border-foreground/40 pt-2 text-xs text-muted-foreground">
              Няравын гарын үсэг
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
