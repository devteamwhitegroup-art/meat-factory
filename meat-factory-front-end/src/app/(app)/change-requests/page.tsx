import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorNotice } from "@/components/common/ListState";
import { Card, CardContent } from "@/components/ui/card";
import { requireCap } from "@/lib/auth/server";
import { getClient } from "@/lib/apollo/server";
import { RegistrationChangeRequestsDoc } from "@/lib/queries/registration";
import { unwrapList } from "@/lib/unwrap";
import { compact } from "@/lib/compact";
import { fmtDateTime } from "@/lib/format/date";
import {
  CHANGE_REQUEST_STATUS_COLOR,
  CHANGE_REQUEST_STATUS_MN,
} from "@/lib/format/enum";
import { getFactories } from "@/lib/factory/server";
import { factoryName } from "@/lib/factory/factories";
import type { Change_Request_Status } from "@/lib/gql/graphql";
import { ReviewActions } from "./_components/ReviewActions";
import { chipCls } from "@/components/ui/segmented";
import { PageHeader } from "@/components/common/PageHeader";

type Props = { searchParams: Promise<{ status?: string }> };

// ponytail: newest 50, no pager — add one if the history outgrows it.
const LIMIT = 50;

// "" = admin's default queue: requests waiting for a decision.
const STATUSES: { value: string; label: string; status: string | null }[] = [
  { value: "", label: CHANGE_REQUEST_STATUS_MN.PENDING, status: "PENDING" },
  {
    value: "approved",
    label: CHANGE_REQUEST_STATUS_MN.APPROVED,
    status: "APPROVED",
  },
  {
    value: "rejected",
    label: CHANGE_REQUEST_STATUS_MN.REJECTED,
    status: "REJECTED",
  },
  { value: "all", label: "Бүгд", status: null },
];

type Line = { animalType?: string | null; count?: number | null } | null;
const fmtLines = (lines?: readonly Line[] | null) =>
  compact(lines)
    .map((l) => (l.count ? `${l.animalType} ${l.count}` : l.animalType))
    .join(", ") || "—";

// Staff fix intake data after its registration day via a request; admin
// compares current vs proposed here and approves (applies) or rejects.
export default async function ChangeRequestsPage({ searchParams }: Props) {
  await requireCap("CHANGE_REQUEST_REVIEW");
  const factories = await getFactories();
  const sp = await searchParams;
  const current =
    STATUSES.find((s) => s.value === (sp.status ?? "")) ?? STATUSES[0];

  const { data } = await getClient().query({
    query: RegistrationChangeRequestsDoc,
    variables: {
      status: current.status as Change_Request_Status | null,
      limit: LIMIT,
      page: 1,
    },
  });
  const { rows, count, error } = unwrapList(
    data?.registrationChangeRequests,
    data?.registrationChangeRequests?.changeRequests,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Засварын хүсэлт"
        description="Бүртгэсэн өдөр өнгөрсний дараах засварыг энд шийдвэрлэнэ. Зөвшөөрөхөд бүртгэл шууд засагдана."
      />

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={
              s.value
                ? `/change-requests?status=${s.value}`
                : "/change-requests"
            }
            className={chipCls(current.value === s.value)}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <ErrorNotice message={error} />

      {rows.length === 0 ? (
        <EmptyState>Хүсэлт алга</EmptyState>
      ) : (
        rows.map((q) => {
          const reg = q.registration;
          const c = q.changes;
          const status = q.status ?? "PENDING";
          const i = c?.intake;
          const kgPrice = (kg?: number | null, price?: number | null) =>
            `${kg ?? "—"} кг · ${price == null ? "—" : `${price}₮`}`;
          // Only the parts the request touches.
          const diff = [
            ...(i
              ? [
                  {
                    label: "Малчин",
                    now: reg?.herder?.name,
                    next: i.herder?.name,
                  },
                  {
                    label: "Машины дугаар",
                    now: reg?.vehicleNumber,
                    next: i.vehicleNumber,
                  },
                  { label: "Таних тэмдэг", now: reg?.stamp, next: i.stamp },
                  {
                    label: "Малын тоо",
                    now: fmtLines(reg?.animalLines),
                    next: fmtLines(i.animalLines),
                  },
                ]
              : []),
            ...compact(c?.weights).map((w) => ({
              label: `Жин #${w.entry?.sequenceNo ?? ""} ${w.entry?.animalType ?? ""}`,
              now: kgPrice(w.entry?.weightKg, w.entry?.pricePerKg),
              next: kgPrice(w.weightKg, w.pricePerKg),
            })),
            ...compact(c?.added).map((a) => ({
              label: `Шинэ жин: ${a.animalType}`,
              now: null,
              next: kgPrice(a.weightKg, a.pricePerKg),
            })),
          ];
          return (
            <Card key={q.id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link
                    href={`/registrations/${reg?.id}`}
                    className="font-mono font-semibold hover:underline"
                  >
                    {reg?.registrationCode}
                  </Link>
                  {reg?.factory ? (
                    <Badge variant="outline">
                      {factoryName(factories, reg.factory)}
                    </Badge>
                  ) : null}
                  <Badge className={CHANGE_REQUEST_STATUS_COLOR[status]}>
                    {CHANGE_REQUEST_STATUS_MN[status]}
                  </Badge>
                  <span className="text-muted-foreground">
                    {q.requestedBy?.param} · {fmtDateTime(q.createdAt)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Шалтгаан: </span>
                  {q.reason}
                </div>
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-1 font-normal" />
                      <th className="py-1 font-normal">Одоогийн</th>
                      <th className="py-1 font-normal">Шинэ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.map((d) => {
                      const changed = (d.now ?? "") !== (d.next ?? "");
                      return (
                        <tr key={d.label} className="border-t">
                          <td className="py-1.5 pr-3 text-muted-foreground">
                            {d.label}
                          </td>
                          <td className="py-1.5 pr-3">{d.now || "—"}</td>
                          <td
                            className={
                              "py-1.5 " +
                              (changed ? "font-semibold text-amber-700" : "")
                            }
                          >
                            {d.next || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {status === "PENDING" ? (
                  <ReviewActions id={q.id!} />
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {q.reviewedBy?.param} · {fmtDateTime(q.reviewedAt)}
                    {q.reviewNote ? ` — ${q.reviewNote}` : ""}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <div className="text-xs text-muted-foreground">Нийт: {count}</div>
    </div>
  );
}
