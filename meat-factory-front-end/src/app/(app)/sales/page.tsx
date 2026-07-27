import Link from "next/link";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { requireCap } from "@/lib/auth/server";
import { CustomerSalesTab } from "./_components/CustomerSalesTab";
import { HerderSettlementsTab } from "./_components/HerderSettlementsTab";

const TAB_LIST =
  "inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1";
function tabCls(active: boolean) {
  return (
    "inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all " +
    (active
      ? "bg-background text-foreground shadow-sm"
      : "text-foreground/60 hover:text-foreground")
  );
}

type Props = {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    paid?: string;
    page?: string;
    from?: string;
    to?: string;
  }>;
};

// Two independent data sources under one page: herder payouts (Settlement,
// created per-registration in the livestock flow) and customer sales
// (SalesTransaction). Different shapes, different queries — just sharing the
// date filter and page chrome.
export default async function SalesPage({ searchParams }: Props) {
  await requireCap("sales");
  const sp = await searchParams;
  const tab = sp.tab === "herders" ? "herders" : "customers";
  const tabHref = (t: string) => {
    const params = new URLSearchParams();
    params.set("tab", t);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    return `/sales?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Гүйлгээнүүд</h1>
        <DateRangeFilter />
      </div>

      <div className={TAB_LIST}>
        <Link href={tabHref("customers")} className={tabCls(tab === "customers")}>
          Харилцагч
        </Link>
        <Link href={tabHref("herders")} className={tabCls(tab === "herders")}>
          Малчид
        </Link>
      </div>

      {tab === "herders" ? (
        <HerderSettlementsTab searchParams={sp} />
      ) : (
        <CustomerSalesTab searchParams={sp} />
      )}
    </div>
  );
}
