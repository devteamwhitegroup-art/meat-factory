import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { MedicalStatusActions } from "@/components/registration/MedicalStatusActions";
import { requireCap } from "@/lib/auth/server";
import { isCrossFactoryRole } from "@/lib/auth/roles";
import { getClient } from "@/lib/apollo/server";
import { MedicalNumbersDoc } from "@/lib/queries/medical-number";
import { unwrapList } from "@/lib/unwrap";
import { fmtDate, fmtDateTime } from "@/lib/format/date";
import {
  FACTORY_MN,
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
  const role = await requireCap("medicalCheck");
  const crossFactory = isCrossFactoryRole(role);
  const sp = await searchParams;
  const current =
    STATUSES.find((s) => s.value === (sp.status ?? "")) ?? STATUSES[0];
  const factory =
    sp.factory && sp.factory in FACTORY_MN ? (sp.factory as never) : null;
  const page = Math.max(1, Number(sp.page) || 1);

  // Chip / pager links keep the other filters.
  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = {
      status: sp.status ?? null,
      q: sp.q ?? null,
      factory: sp.factory ?? null,
      page: null,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/medical-numbers?${qs}` : "/medical-numbers";
  };

  const { data } = await getClient().query({
    query: MedicalNumbersDoc,
    variables: {
      status: current.status as Medical_Number_Status | null,
      number: sp.q || null,
      factory,
      limit: PAGE_SIZE,
      page,
    },
  });
  const {
    rows,
    count,
    error: errorMsg,
  } = unwrapList(data?.medicalNumbers, data?.medicalNumbers?.medicalNumbers);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Мал эмнэлгийн дугаар</h1>
        <p className="text-sm text-muted-foreground">
          Дугаарыг улсын системээс шалгаад төлөвийг тэмдэглэнэ. Бүх дугаар нь
          баталгаажсан бүртгэлийн суутгалыг олгох боломжтой болно.
        </p>
      </div>

      {crossFactory ? <FactoryFilter /> : null}

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

      {errorMsg ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMsg}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Дугаар олдсонгүй
        </div>
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
                        {FACTORY_MN[reg?.factory ?? ""] ?? "—"}
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

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Нийт: {count}</span>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={href({ page: String(page - 1) })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              ←
            </Link>
          ) : null}
          <span>Хуудас {page}</span>
          {page * PAGE_SIZE < count ? (
            <Link
              href={href({ page: String(page + 1) })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
