import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { RegistrationCard } from '@/components/registration/RegistrationCard';
import { getClient } from '@/lib/apollo/server';
import { RegistrationListDoc } from '@/lib/queries/registration';
import { unwrap } from '@/lib/unwrap';
import { compact } from '@/lib/compact';

type Props = {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
};

const STATUSES = [
  { value: '', label: 'Бүгд' },
  { value: 'REGISTERED', label: 'Бүртгэгдсэн' },
  { value: 'WEIGHING', label: 'Хэмжигдэж буй' },
  { value: 'WEIGHED', label: 'Хэмжигдсэн' },
  { value: 'VERIFIED', label: 'Баталгаажсан' },
  { value: 'SETTLED', label: 'Тооцоологдсон' },
  { value: 'CANCELLED', label: 'Цуцлагдсан' },
];

export default async function RegistrationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status =
    sp.status && STATUSES.some((s) => s.value === sp.status)
      ? sp.status
      : null;
  const page = Number(sp.page) || 1;

  const { data } = await getClient().query({
    query: RegistrationListDoc,
    variables: { status: status as never, limit: 24, page },
  });

  type Row = NonNullable<
    NonNullable<NonNullable<typeof data>['registrations']>['registrations']
  >[number];
  let rows: NonNullable<Row>[] = [];
  let count = 0;
  let errorMsg: string | null = null;

  try {
    const d = unwrap(data?.registrations);
    rows = compact(d.registrations);
    count = d.count ?? 0;
  } catch (e) {
    errorMsg = (e as Error).message;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Бүртгэлийн дугаарын хэсэг</h1>
        <Link href="/registrations/new" className={buttonVariants()}>
          Шинэ бүртгэл
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = (status ?? '') === s.value;
          const href = s.value
            ? `/registrations?status=${s.value}`
            : '/registrations';
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
