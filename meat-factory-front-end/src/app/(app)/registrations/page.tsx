import Link from "next/link";
import { ClipboardPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { chipCls } from "@/components/ui/segmented";
import { EmptyState, ErrorNotice } from "@/components/common/ListState";
import { PageHeader } from "@/components/common/PageHeader";
import { LinkPaginationFooter } from "@/components/common/PaginationFooter";
import { RegistrationCard } from "@/components/registration/RegistrationCard";
import { STATUS_STYLE } from "@/components/registration/StatusBadge";
import { getClient } from "@/lib/apollo/server";
import { RegistrationListDoc } from "@/lib/queries/registration";
import type { Registration_Status } from "@/lib/gql/graphql";
import { unwrapList } from "@/lib/unwrap";
import { compact } from "@/lib/compact";
import { pageAndRange } from "@/lib/date/range";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { REGISTRATION_STATUS_MN } from "@/lib/format/enum";
import { getFactories } from "@/lib/factory/server";
import { factoryKind, factoryName } from "@/lib/factory/factories";
import { FactoryFilter } from "@/components/common/FactoryFilter";
import { canCreateRegistration } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/server";

type Props = {
  searchParams: Promise<{
    stage?: string;
    factory?: string;
    page?: string;
    from?: string;
    to?: string;
  }>;
};

type Stage = { value: string; label: string; statuses: Registration_Status[] };

const PAGE_SIZE = 24;

// One chip per REGISTRATION_STATUS value (plus "Бүгд") — every status is
// individually filterable. Derived from REGISTRATION_STATUS_MN (single
// source of truth for the Mongolian labels) so a future status shows up
// here automatically.
const STAGES: Stage[] = [
  { value: "", label: "Бүгд", statuses: [] },
  ...Object.entries(REGISTRATION_STATUS_MN).map(([status, label]) => ({
    value: status.toLowerCase(),
    label,
    statuses: [status as Registration_Status],
  })),
];

// нярав / эмч work the floor only — payment statuses belong to the accountant,
// so their "Бүгд" and chips cover just these.
const FLOOR_STATUSES: Registration_Status[] = [
  "REGISTERED",
  "WEIGHED",
  "VERIFIED",
];
const FLOOR_STAGES: Stage[] = [
  { value: "", label: "Бүгд", statuses: FLOOR_STATUSES },
  ...STAGES.filter((s) => s.statuses.some((x) => FLOOR_STATUSES.includes(x))),
];

// Grouped stages other pages link to (the dashboard pipeline tile); shown
// as a chip only while selected.
const LINKED_STAGES: Stage[] = [
  {
    value: "in_process",
    label: "Дүн тооцоолж буй",
    statuses: ["WEIGHED", "VERIFIED"],
  },
];

export default async function RegistrationsPage({ searchParams }: Props) {
  const [session, factories] = await Promise.all([
    getSession(),
    getFactories(),
  ]);
  // Cross-factory roles get a factory filter + per-card badge; staff are
  // BE-scoped.
  const crossFactory = session.crossFactory;
  // Floor staff (no payout rights) see only the floor stages.
  const stages = session.can("SETTLEMENT_PAY") ? STAGES : FLOOR_STAGES;
  const sp = await searchParams;
  const factory = factories.some((f) => f.code === sp.factory)
    ? (sp.factory as string)
    : null;
  const linked = LINKED_STAGES.find((s) => s.value === sp.stage);
  const stage =
    linked ?? stages.find((s) => s.value === (sp.stage ?? "")) ?? stages[0];
  const { page, dateRange } = pageAndRange(sp);

  // Chip / page hrefs keep the other filters.
  const href = (over: { stage?: string; page?: number }) => {
    const params = new URLSearchParams();
    const st = over.stage ?? stage.value;
    if (st) params.set("stage", st);
    if (factory) params.set("factory", factory);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    if (over.page && over.page > 1) params.set("page", String(over.page));
    const qs = params.toString();
    return qs ? `/registrations?${qs}` : "/registrations";
  };

  const { data } = await getClient().query({
    query: RegistrationListDoc,
    variables: {
      statuses: stage.statuses.length > 0 ? stage.statuses : null,
      factory,
      dateRange,
      limit: PAGE_SIZE,
      page,
    },
  });

  const {
    rows,
    count,
    error: errorMsg,
  } = unwrapList(data?.registrations, data?.registrations?.registrations);

  const chips = linked ? [linked, ...stages] : stages;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Бүртгэл"
        description="Хүлээн авсан мал, махны бүртгэлүүд. Бүртгэл дээр дарж дараагийн алхмыг хийнэ."
        actions={
          <>
            <DateRangeFilter />
            {canCreateRegistration(
              session.perms,
              factoryKind(factories, session.factory),
            ) ? (
              <Link href="/registrations/new" className={buttonVariants()}>
                <ClipboardPlus />
                Шинэ бүртгэл
              </Link>
            ) : null}
          </>
        }
      />

      {crossFactory ? <FactoryFilter /> : null}

      <div className="flex flex-wrap gap-2">
        {chips.map((s) => {
          const Icon =
            s.statuses.length === 1 ? STATUS_STYLE[s.statuses[0]]?.icon : null;
          return (
            <Link
              key={s.value}
              href={href({ stage: s.value })}
              className={chipCls(stage.value === s.value)}
            >
              {Icon ? <Icon className="mr-1.5 size-4" /> : null}
              {s.label}
            </Link>
          );
        })}
      </div>

      <ErrorNotice message={errorMsg} />

      {rows.length === 0 ? (
        <EmptyState>Энэ шүүлтүүрт бүртгэл олдсонгүй</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {rows.map((r) => (
            <RegistrationCard
              key={r.id}
              id={r.id!}
              registrationCode={r.registrationCode ?? null}
              status={r.status ?? "REGISTERED"}
              herderName={r.herder?.name ?? null}
              vehicleNumber={r.vehicleNumber}
              intakeDate={r.intakeDate}
              factoryLabel={
                crossFactory ? factoryName(factories, r.factory) : null
              }
              animalLines={compact(r.animalLines).map((l) => ({
                animalType: l.animalType ?? "",
                count: l.count ?? 0,
              }))}
            />
          ))}
        </div>
      )}

      <LinkPaginationFooter
        page={page}
        total={count}
        prevHref={page > 1 ? href({ page: page - 1 }) : null}
        nextHref={page * PAGE_SIZE < count ? href({ page: page + 1 }) : null}
      />
    </div>
  );
}
