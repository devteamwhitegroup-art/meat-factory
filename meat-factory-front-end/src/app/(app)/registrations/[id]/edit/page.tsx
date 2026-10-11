import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BackButton } from "@/components/common/BackButton";
import { requireCap } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { isPreButchered } from "@/lib/factory/factories";
import { getClient } from "@/lib/apollo/server";
import {
  RegistrationChangeRequestsDoc,
  RegistrationDetailDoc,
} from "@/lib/queries/registration";
import { compact } from "@/lib/compact";
import { fmtDateTime } from "@/lib/format/date";
import {
  CHANGE_REQUEST_STATUS_COLOR,
  CHANGE_REQUEST_STATUS_MN,
} from "@/lib/format/enum";
import { EditForm } from "./edit-form";
import { WeighingForm } from "./weighing-form";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
};

// Mirrors BE EDITABLE_STATUSES — frozen once a settlement exists.
const EDITABLE = ["REGISTERED", "WEIGHED", "VERIFIED"];

const SECTIONS = [
  {
    value: "intake",
    label: "Бүртгэлийн мэдээлэл",
    hint: "Малчин, машин, малын тоо",
  },
  { value: "weighing", label: "Жингийн мэдээлэл", hint: "Жин, үнэ, жин нэмэх" },
];

// Registration fixes, one section at a time. Intake: direct the same day (or
// admin), a change request after. Finished weighing: always a request (admin
// fixes it directly on the weigh page).
export default async function EditRegistrationPage({
  params,
  searchParams,
}: Props) {
  const session = await requireCap("REGISTRATION_CREATE");
  const factories = await getFactories();
  const { id } = await params;
  const section =
    (await searchParams).section === "weighing" ? "weighing" : "intake";
  const client = getClient();
  const [{ data }, { data: reqData }] = await Promise.all([
    client.query({ query: RegistrationDetailDoc, variables: { id } }),
    client.query({
      query: RegistrationChangeRequestsDoc,
      variables: { registrationId: id, limit: 20, page: 1 },
    }),
  ]);
  const r = data?.registration?.registration;
  if (!r) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        {data?.registration?.message ?? "Бүртгэл олдсонгүй"}
      </div>
    );
  }
  const requests = compact(reqData?.registrationChangeRequests?.changeRequests);
  const pending = requests.some((q) => q.status === "PENDING");
  const direct = !!r.editableByMe;
  const status = r.status ?? "";
  const weighHref = `/registrations/${id}/weigh`;

  // Why the section can't be edited here (null = show the form).
  const blocked = !EDITABLE.includes(status)
    ? "Тооцоо үүссэн бүртгэлийг засах боломжгүй."
    : section === "intake"
      ? !direct && pending
        ? "Хүлээгдэж буй хүсэлт байна — админ шийдвэрлэсний дараа дахин илгээнэ үү."
        : null
      : status === "REGISTERED"
        ? "Жинлэлт дуусаагүй — Хэмжүүр хуудаснаас шууд засна."
        : session.can("REGISTRATION_WEIGH_FIX")
          ? "Жин засах эрхтэй — Хэмжүүр хуудаснаас шууд засна."
          : pending
            ? "Хүлээгдэж буй хүсэлт байна — админ шийдвэрлэсний дараа дахин илгээнэ үү."
            : null;
  const weighLink =
    section === "weighing" &&
    EDITABLE.includes(status) &&
    (status === "REGISTERED"
      ? session.can("REGISTRATION_WEIGH")
      : session.can("REGISTRATION_WEIGH_FIX"));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-6">
        <BackButton href={`/registrations/${id}`} />
        <div>
          <h1 className="text-2xl font-semibold">Бүртгэл засах</h1>
          <div className="font-mono text-sm text-muted-foreground">
            {r.registrationCode}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
        <nav className="flex gap-2 md:flex-col">
          {SECTIONS.map((s) => (
            <Link
              key={s.value}
              href={`/registrations/${id}/edit?section=${s.value}`}
              className={
                "flex-1 rounded-md border px-3 py-2 transition-colors md:flex-none " +
                (section === s.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted")
              }
            >
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.hint}</div>
            </Link>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          {section === "intake" && !direct && !blocked ? (
            <p className="text-sm text-muted-foreground">
              Бүртгэсэн өдөр өнгөрсөн тул өөрчлөлт админ зөвшөөрсний дараа
              хэрэгжинэ.
            </p>
          ) : null}
          {section === "weighing" && !blocked ? (
            <p className="text-sm text-muted-foreground">
              Жинлэлт дууссан тул өөрчлөлт админ зөвшөөрсний дараа хэрэгжинэ.
            </p>
          ) : null}

          {blocked ? (
            <div className="space-y-3 rounded-md border border-dashed p-6 text-center text-muted-foreground">
              <div>{blocked}</div>
              {weighLink ? (
                <Link
                  href={weighHref}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Хэмжүүр
                </Link>
              ) : null}
            </div>
          ) : section === "intake" ? (
            <EditForm
              id={id}
              direct={direct}
              pre={isPreButchered(factories, r.factory)}
              quickHerder={!session.can("HERDER_EDIT")}
              initial={{
                herderId: r.herder?.id ?? "",
                herderLabel: r.herder?.name || r.herder?.registrationNo || "",
                vehicleNumber: r.vehicleNumber ?? "",
                stamp: r.stamp ?? "",
                counts: Object.fromEntries(
                  compact(r.animalLines).map((l) => [
                    l.animalType ?? "",
                    // Хойд үйлдвэр lines carry no count → mark as selected.
                    isPreButchered(factories, r.factory) ? 1 : (l.count ?? 0),
                  ]),
                ),
              }}
            />
          ) : (
            <WeighingForm
              id={id}
              entries={compact(r.weighingEntries).map((e) => ({
                id: e.id!,
                sequenceNo: e.sequenceNo ?? null,
                animalType: e.animalType ?? null,
                weightKg: Number(e.weightKg),
                pricePerKg: e.pricePerKg == null ? null : Number(e.pricePerKg),
              }))}
              animalTypes={compact(r.animalLines).map(
                (l) => l.animalType ?? "",
              )}
            />
          )}

          {requests.length > 0 ? (
            <div className="space-y-2 pt-2">
              <div className="text-sm font-semibold">Илгээсэн хүсэлтүүд</div>
              {requests.map((q) => (
                <div
                  key={q.id}
                  className="space-y-1 rounded-md border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        CHANGE_REQUEST_STATUS_COLOR[q.status ?? "PENDING"]
                      }
                    >
                      {CHANGE_REQUEST_STATUS_MN[q.status ?? "PENDING"]}
                    </Badge>
                    <span className="text-muted-foreground">
                      {q.requestedBy?.param} · {fmtDateTime(q.createdAt)}
                    </span>
                  </div>
                  <div>{q.reason}</div>
                  {q.reviewNote ? (
                    <div className="text-muted-foreground">
                      Админ: {q.reviewNote}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
