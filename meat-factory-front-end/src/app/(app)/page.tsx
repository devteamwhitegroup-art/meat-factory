import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  Calculator,
  CircleCheckBig,
  ClipboardPlus,
  FilePenLine,
  Globe,
  HandCoins,
  PackageOpen,
  Receipt,
  Scale,
  ShieldCheck,
  Stethoscope,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { getClient } from "@/lib/apollo/server";
import {
  RegistrationChangeRequestsDoc,
  RegistrationListDoc,
} from "@/lib/queries/registration";
import { MedicalNumbersDoc } from "@/lib/queries/medical-number";
import { FactoryTransfersDoc } from "@/lib/queries/factory-transfer";
import type { Permission, Registration_Status } from "@/lib/gql/graphql";
import { canCreateRegistration } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { factoryKind } from "@/lib/factory/factories";
import { fmtLongDate } from "@/lib/format/date";
import { REGISTRATION_STATUS_MN } from "@/lib/format/enum";
import { cn } from "@/lib/utils";

// Нүүр: everyone lands here. It answers "what is waiting for me?" with one
// big counter per job the account can do, plus the forms it opens most.
// Counts reuse the list queries (limit 1 → `count`), so no extra API.

type Job = {
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  tone: string;
  count: Promise<number | null>;
};

// Never let one failed count take the board down: it shows "—".
function settle(p: Promise<number | null | undefined>): Promise<number | null> {
  return p.then((n) => n ?? null).catch(() => null);
}

function registrationCount(
  statuses: Registration_Status[],
  factory: string | null = null,
) {
  return settle(
    getClient()
      .query({
        query: RegistrationListDoc,
        variables: { statuses, factory, limit: 1 },
      })
      .then(({ data }) =>
        data?.registrations?.success ? data.registrations.count : null,
      ),
  );
}

const TONE = {
  slate: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
  blue: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
  indigo: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-400",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  rose: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
  violet: "bg-violet-500/12 text-violet-700 dark:text-violet-400",
  teal: "bg-teal-500/12 text-teal-700 dark:text-teal-400",
};

export default async function HomePage() {
  const [s, factories] = await Promise.all([getSession(), getFactories()]);
  const kind = factoryKind(factories, s.factory);
  const byproductSite = kind === "BYPRODUCT";
  const pre = kind === "PRE_BUTCHERED";
  const can = (...p: Permission[]) => s.can(...p);
  const stage = (status: string) =>
    `/registrations?stage=${status.toLowerCase()}`;
  const statusHint = (status: string) =>
    `«${REGISTRATION_STATUS_MN[status]}» төлөвтэй`;

  // The livestock pipeline, one job per hand-off. Pre-butchered sites skip
  // verification: WEIGHED goes straight to the accountant.
  const jobs: Job[] = [];
  if (!byproductSite) {
    if (can("REGISTRATION_WEIGH"))
      jobs.push({
        label: pre ? "Жин баталгаажуулах" : "Жинлэх",
        hint: statusHint("REGISTERED"),
        href: stage("REGISTERED"),
        icon: Scale,
        tone: TONE.slate,
        count: registrationCount(["REGISTERED"]),
      });
    if (pre ? can("SETTLEMENT_CREATE") : can("REGISTRATION_VERIFY"))
      jobs.push({
        label: pre ? "Тооцоо хийх" : "Баталгаажуулах",
        hint: statusHint("WEIGHED"),
        href: stage("WEIGHED"),
        icon: pre ? Calculator : ShieldCheck,
        tone: TONE.blue,
        count: registrationCount(["WEIGHED"]),
      });
    // Cross-factory finance can't verify, but pre-butchered sites settle
    // straight from WEIGHED — count just those, per site.
    else if (!kind && can("SETTLEMENT_CREATE"))
      for (const f of factories.filter(
        (f) => f.isActive && f.kind === "PRE_BUTCHERED",
      ))
        jobs.push({
          label: "Тооцоо хийх",
          hint: `${f.name} · ${statusHint("WEIGHED")}`,
          href: `${stage("WEIGHED")}&factory=${f.code}`,
          icon: Calculator,
          tone: TONE.blue,
          count: registrationCount(["WEIGHED"], f.code),
        });
    if (!pre && can("SETTLEMENT_CREATE"))
      jobs.push({
        label: "Тооцоо хийх",
        hint: statusHint("VERIFIED"),
        href: stage("VERIFIED"),
        icon: Calculator,
        tone: TONE.indigo,
        count: registrationCount(["VERIFIED"]),
      });
    if (can("SETTLEMENT_PAY")) {
      jobs.push({
        label: "Төлбөр олгох",
        hint: statusHint("PAYMENT_PENDING"),
        href: stage("PAYMENT_PENDING"),
        icon: Banknote,
        tone: TONE.amber,
        count: registrationCount(["PAYMENT_PENDING"]),
      });
      jobs.push({
        label: "Үлдэгдэл олгох",
        hint: statusHint("PARTIALLY_SETTLED"),
        href: stage("PARTIALLY_SETTLED"),
        icon: HandCoins,
        tone: TONE.orange,
        count: registrationCount(["PARTIALLY_SETTLED"]),
      });
    }
    if (can("MEDICAL_NUMBER_CHECK"))
      jobs.push({
        label: "Эмнэлгийн дугаар шалгах",
        hint: "Баталгаажилт хийгдээгүй дугаар",
        href: "/medical-numbers",
        icon: Stethoscope,
        tone: TONE.rose,
        count: settle(
          getClient()
            .query({
              query: MedicalNumbersDoc,
              variables: { status: "PENDING", limit: 1 },
            })
            .then(({ data }) =>
              data?.medicalNumbers?.success ? data.medicalNumbers.count : null,
            ),
        ),
      });
  }
  if (can("CHANGE_REQUEST_REVIEW"))
    jobs.push({
      label: "Засварын хүсэлт шийдэх",
      hint: "Хүлээгдэж буй хүсэлт",
      href: "/change-requests",
      icon: FilePenLine,
      tone: TONE.violet,
      count: settle(
        getClient()
          .query({
            query: RegistrationChangeRequestsDoc,
            variables: { status: "PENDING", limit: 1 },
          })
          .then(({ data }) =>
            data?.registrationChangeRequests?.success
              ? data.registrationChangeRequests.count
              : null,
          ),
      ),
    });
  // Goods on the road to this site wait for a receiver here.
  if (s.factory && can("SHIPMENT_VIEW"))
    jobs.push({
      label: "Ачаа хүлээн авах",
      hint: "Өөр үйлдвэрээс замд яваа",
      href: "/shipments/transfers",
      icon: ArrowLeftRight,
      tone: TONE.teal,
      // ponytail: first 100 in-transit rows, filtered here — the list arg
      // matches sender OR receiver. Add a `toFactory` arg if it ever overflows.
      count: settle(
        getClient()
          .query({
            query: FactoryTransfersDoc,
            variables: { status: "IN_TRANSIT", limit: 100 },
          })
          .then(({ data }) =>
            data?.factoryTransfers?.success
              ? (data.factoryTransfers.transfers ?? []).filter(
                  (t) => t?.toFactory === s.factory,
                ).length
              : null,
          ),
      ),
    });

  const counts = await Promise.all(jobs.map((j) => j.count));
  const waiting = counts.reduce<number>((a, n) => a + (n ?? 0), 0);

  // The forms people open most, biggest first.
  const actions: {
    label: string;
    hint: string;
    href: string;
    icon: LucideIcon;
  }[] = [];
  if (!byproductSite && canCreateRegistration(s.perms, kind))
    actions.push({
      label: "Шинэ бүртгэл",
      hint: pre ? "Мах хүлээн авах" : kind ? "Мал хүлээн авах" : "Мал, мах хүлээн авах",
      href: "/registrations/new",
      icon: ClipboardPlus,
    });
  if ((byproductSite || !s.factory) && can("BYPRODUCT_PROCESS"))
    actions.push({
      label: "Дайвар задлах",
      hint: "Шинэ задлалт бүртгэх",
      href: "/byproduct/new",
      icon: PackageOpen,
    });
  if (can("SALES_MANAGE"))
    actions.push({
      label: "Шинэ гүйлгээ",
      hint: "Харилцагчид борлуулах",
      href: "/sales/new",
      icon: Receipt,
    });
  if (can("SHIPMENT_MANAGE")) {
    actions.push({
      label: "Дотоод ачилт",
      hint: "Дотоодын харилцагч руу",
      href: "/shipments/domestic/new",
      icon: Truck,
    });
    if (!byproductSite)
      actions.push({
        label: "Экспорт ачилт",
        hint: "Гадаад руу",
        href: "/shipments/export/new",
        icon: Globe,
      });
    actions.push({
      label: "Үйлдвэр хооронд",
      hint: "Өөр үйлдвэр рүү илгээх",
      href: "/shipments/transfers/new",
      icon: ArrowLeftRight,
    });
  }

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <p className="text-base text-muted-foreground">
          {fmtLongDate(new Date())}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Сайн байна уу{s.name ? `, ${s.name}` : ""}!
        </h1>
        <p className="text-lg text-muted-foreground">
          {jobs.length === 0
            ? actions.length > 0
              ? "Доорх товчоор ажлаа эхлүүлнэ үү."
              : "Цэснээс хийх ажлаа сонгоно уу."
            : waiting > 0
              ? `Танд хийх ${waiting} ажил хүлээж байна.`
              : "Одоогоор хүлээгдэж буй ажил алга."}
        </p>
      </div>

      {actions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Шинээр эхлүүлэх</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {actions.map((a, i) => (
              <Link
                key={a.href}
                href={a.href}
                className={cn(
                  "group flex items-center gap-4 rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  i === 0
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-card hover:border-primary/50 hover:shadow-md",
                )}
              >
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    i === 0 ? "bg-white/15" : "bg-primary/10 text-primary",
                  )}
                >
                  <a.icon className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold">{a.label}</span>
                  <span
                    className={cn(
                      "block text-sm",
                      i === 0 ? "opacity-85" : "text-muted-foreground",
                    )}
                  >
                    {a.hint}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {jobs.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Таны хийх ажил</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {jobs.map((j, i) => {
              const n = counts[i];
              const idle = n === 0;
              return (
                <Link
                  key={j.href + j.label}
                  href={j.href}
                  className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition outline-none hover:border-primary/50 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-xl",
                        idle ? "bg-muted text-muted-foreground" : j.tone,
                      )}
                    >
                      <j.icon className="size-6" />
                    </span>
                    <span
                      className={cn(
                        "text-4xl font-bold tabular-nums",
                        idle && "text-muted-foreground/60",
                      )}
                    >
                      {n ?? "—"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-lg font-semibold leading-snug">
                      {j.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {idle ? "Хийх ажил алга" : j.hint}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Жагсаалт нээх
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
          {waiting === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-4 text-base text-emerald-800 dark:text-emerald-300">
              <CircleCheckBig className="size-6 shrink-0" />
              Бүх ажил хийгдсэн байна. Баярлалаа!
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
