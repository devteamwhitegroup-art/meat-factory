import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { RegistrationCard } from '@/components/registration/RegistrationCard';
import { getClient } from '@/lib/apollo/server';
import { RegistrationListDoc } from '@/lib/queries/registration';
import { unwrapList } from '@/lib/unwrap';
import { compact } from '@/lib/compact';
import { parseRange, thisMonth } from '@/lib/date/range';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';

type Props = {
  searchParams: Promise<{
    stage?: string;
    page?: string;
    from?: string;
    to?: string;
  }>;
};

// Stage chips: each maps to a SET of statuses that the BE filters as
// `status IN (…)`. Order = pipeline order so the chips read left-to-right.
const STAGES: Array<{
  value: string;
  label: string;
  statuses: string[];
}> = [
  { value: '', label: 'Бүгд', statuses: [] },
  { value: 'registered', label: 'Бүртгэгдсэн', statuses: ['REGISTERED'] },
  {
    value: 'in_process',
    // Weighing → verification stage: amount being finalised.
    label: 'Дүн тооцоолж буй',
    statuses: ['WEIGHED', 'VERIFIED'],
  },
  {
    value: 'payment_pending',
    label: 'Төлбөр хүлээгдэж буй',
    statuses: ['PAYMENT_PENDING'],
  },
  { value: 'paid', label: 'Төлбөр хийгдсэн', statuses: ['SETTLED'] },
];

export default async function RegistrationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const stage = STAGES.find((s) => s.value === (sp.stage ?? '')) ?? STAGES[0];
  const page = Number(sp.page) || 1;
  const def = thisMonth();
  const dateRange = parseRange(sp.from ?? def.from, sp.to ?? def.to);

  // Stage chip hrefs preserve the active date range so switching stage doesn't
  // drop the filter.
  const stageHref = (stageVal: string) => {
    const params = new URLSearchParams();
    if (stageVal) params.set('stage', stageVal);
    if (sp.from) params.set('from', sp.from);
    if (sp.to) params.set('to', sp.to);
    const qs = params.toString();
    return qs ? `/registrations?${qs}` : '/registrations';
  };

  const { data } = await getClient().query({
    query: RegistrationListDoc,
    variables: {
      statuses: stage.statuses.length > 0 ? (stage.statuses as never) : null,
      dateRange,
      limit: 24,
      page,
    },
  });

  const {
    rows,
    count,
    error: errorMsg,
  } = unwrapList(data?.registrations, data?.registrations?.registrations);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Бүртгэлийн дугаарын хэсэг</h1>
        <div className="flex items-center gap-2">
          <DateRangeFilter />
          <Link href="/registrations/new" className={buttonVariants()}>
            Шинэ бүртгэл
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STAGES.map((s) => {
          const active = stage.value === s.value;
          const href = stageHref(s.value);
          return (
            <Link
              key={s.value}
              href={href}
              className={
                'rounded-full border px-3 py-1 text-xs transition-colors ' +
                (active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted')
              }
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {errorMsg ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMsg}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Бүртгэл олдсонгүй
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r) => (
            <RegistrationCard
              key={r.id}
              id={r.id!}
              registrationNumber={r.registrationNumber ?? 0}
              status={r.status ?? 'REGISTERED'}
              herderName={r.herder?.name ?? null}
              animalLines={compact(r.animalLines).map((l) => ({
                animalType: l.animalType ?? '',
                count: l.count ?? 0,
              }))}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">Нийт: {count}</div>
    </div>
  );
}
