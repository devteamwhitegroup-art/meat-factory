import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorNotice } from "@/components/common/ListState";
import { LinkPaginationFooter } from "@/components/common/PaginationFooter";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FactoryFilter } from "@/components/common/FactoryFilter";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { MedicalStatusActions } from "@/components/registration/MedicalStatusActions";
import { requireCap } from "@/lib/auth/server";
import { getClient } from "@/lib/apollo/server";
import {
  MedicalAnimalCountsDoc,
  MedicalNumbersDoc,
} from "@/lib/queries/medical-number";
import { pageAndRange } from "@/lib/date/range";
import { formatNumber } from "@/lib/format/money";
import { compact } from "@/lib/compact";
import { unwrapList } from "@/lib/unwrap";
import { fmtDate, fmtDateTime } from "@/lib/format/date";
import { getFactories } from "@/lib/factory/server";
import { factoryName } from "@/lib/factory/factories";
import {
  MEDICAL_NUMBER_STATUS_COLOR,
  MEDICAL_NUMBER_STATUS_MN,
} from "@/lib/format/enum";
import type { Medical_Number_Status } from "@/lib/gql/graphql";
import { CopyNumber } from "./_components/CopyNumber";

type Props = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    factory?: string;
    page?: string;
    from?: string;
    to?: string;
  }>;
};

const PAGE_SIZE = 50;

// Status chips. "" = the vet's default worklist: numbers not checked yet.
const STATUSES: { value: string; label: string; status: string | null }[] = [
  { value: "", label: MEDICAL_NUMBER_STATUS_MN.PENDING, status: "PENDING" },
  {
    value: "approved",
    label: MEDICAL_NUMBER_STATUS_MN.APPROVED,
    status: "APPROVED",
  },
  {
    value: "rejected",
    label: MEDICAL_NUMBER_STATUS_MN.REJECTED,
    status: "REJECTED",
  },
  { value: "all", label: "Бүгд", status: null },
];

// Vet worklist: every medical number across registrations. The vet checks
// each in the government service and records the result here.
export default async function MedicalNumbersPage({ searchParams }: Props) {
  const session = await requireCap("MEDICAL_NUMBER_CHECK");
  const factories = await getFactories();
  const crossFactory = session.crossFactory;
  const sp = await searchParams;
  const current =
    STATUSES.find((s) => s.value === (sp.status ?? "")) ?? STATUSES[0];
  const factory = factories.some((f) => f.code === sp.factory)
    ? (sp.factory as string)
    : null;
  const page = Math.max(1, Number(sp.page) || 1);
  // Registration intake date; defaults to this month like DateRangeFilter.
  const { dateRange } = pageAndRange(sp);

  // Chip / pager links keep the other filters.
  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = {
      status: sp.status ?? null,
      q: sp.q ?? null,
      factory: sp.factory ?? null,
      from: sp.from ?? null,
      to: sp.to ?? null,
      page: null,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/medical-numbers?${qs}` : "/medical-numbers";
  };

  // Excel export of every page under the current filters.
  const exportParams = new URLSearchParams();
  for (const [k, v] of Object.entries({
    status: current.status,
    q: sp.q,
    factory,
    from: sp.from,
    to: sp.to,
  }))
    if (v) exportParams.set(k, v);

  const client = getClient();
  const [{ data }, { data: countData }] = await Promise.all([
    client.query({
      query: MedicalNumbersDoc,
      variables: {
        status: current.status as Medical_Number_Status | null,
        number: sp.q || null,
        factory,
        dateRange,
        limit: PAGE_SIZE,
        page,
      },
    }),
    client.query({
      query: MedicalAnimalCountsDoc,
      variables: { factory, dateRange },
    }),
  ]);
  const animalCounts = compact(countData?.medicalAnimalCounts?.items);
  const totalHead = animalCounts.reduce((s, c) => s + (c.count ?? 0), 0);
  const {
    rows,
    count,
    error: errorMsg,
  } = unwrapList(data?.medicalNumbers, data?.medicalNumbers?.medicalNumbers);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Мал эмнэлгийн дугаар</h1>
          <p className="text-sm text-muted-foreground">
            Дугаарыг улсын системээс шалгаад төлөвийг тэмдэглэнэ. Бүх дугаар нь
            баталгаажсан бүртгэлийн суутгалыг олгох боломжтой болно.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter />
          {/* Plain <a>, not <Link>: a file download, not a page navigation. */}
          <a
            href={`/medical-numbers/export?${exportParams}`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <DownloadIcon />
            Excel татах
          </a>
        </div>
      </div>

      {crossFactory ? <FactoryFilter /> : null}

      {/* Head brought in over the period, per animal. */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-md border bg-muted/40 px-4 py-2">
          <div className="text-xs text-muted-foreground">Ирсэн мал (нийт)</div>
          <div className="text-xl font-semibold tabular-nums">
            {formatNumber(totalHead)}
          </div>
        </div>
        {animalCounts.map((c) => (
          <div key={c.animalType} className="rounded-md border px-4 py-2">
            <div className="text-xs text-muted-foreground">{c.animalType}</div>
            <div className="text-xl font-semibold tabular-nums">
              {formatNumber(c.count)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s.value}
              href={href({ status: s.value || null })}
              className={
                "rounded-full border px-3 py-1 text-xs transition-colors " +
                (current.value === s.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted")
              }
            >
              {s.label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {sp.status ? (
            <input type="hidden" name="status" value={sp.status} />
          ) : null}
          {sp.factory ? (
            <input type="hidden" name="factory" value={sp.factory} />
          ) : null}
          {sp.from ? <input type="hidden" name="from" value={sp.from} /> : null}
          {sp.to ? <input type="hidden" name="to" value={sp.to} /> : null}
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            inputMode="numeric"
            placeholder="Дугаараар хайх"
            className="w-44 font-mono"
          />
          <Button type="submit" variant="outline">
            Хайх
          </Button>
        </form>
      </div>

      <ErrorNotice message={errorMsg} />

      {rows.length === 0 ? (
        <EmptyState>Дугаар олдсонгүй</EmptyState>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дугаар</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Бүртгэл</TableHead>
                <TableHead>Малчин</TableHead>
                {crossFactory ? <TableHead>Үйлдвэр</TableHead> : null}
                <TableHead>Шалгасан</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((n) => {
                const reg = n.registration;
                const status = n.status ?? "PENDING";
                return (
                  <TableRow key={n.id}>
                    <TableCell>
                      <CopyNumber number={n.number ?? ""} />
                    </TableCell>
                    <TableCell>
                      <Badge className={MEDICAL_NUMBER_STATUS_COLOR[status]}>
                        {MEDICAL_NUMBER_STATUS_MN[status] ?? status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reg?.id ? (
                        <Link
                          href={`/registrations/${reg.id}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {reg.registrationCode ?? "—"}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <div className="text-xs text-muted-foreground">
                        {fmtDate(reg?.intakeDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{reg?.herder?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {reg?.herder?.phone ?? ""}
                      </div>
                    </TableCell>
                    {crossFactory ? (
                      <TableCell>
                        {factoryName(factories, reg?.factory)}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-xs text-muted-foreground">
                      {n.checkedAt ? (
                        <>
                          <div>{n.checkedBy?.param ?? "—"}</div>
                          <div>{fmtDateTime(n.checkedAt)}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <MedicalStatusActions id={n.id!} status={status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <LinkPaginationFooter
        page={page}
        total={count}
        prevHref={page > 1 ? href({ page: String(page - 1) }) : null}
        nextHref={
          page * PAGE_SIZE < count ? href({ page: String(page + 1) }) : null
        }
      />
    </div>
  );
}
