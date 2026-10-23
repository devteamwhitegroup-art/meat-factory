import Link from "next/link";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { requireCap } from "@/lib/auth/server";
import { CustomerSalesTab } from "./_components/CustomerSalesTab";
import { HerderSettlementsTab } from "./_components/HerderSettlementsTab";
import { PageHeader } from "@/components/common/PageHeader";

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
  await requireCap("SALES_MANAGE");
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
      <PageHeader
        title="Гүйлгээ"
        description="Харилцагчид хийсэн борлуулалт болон малчдад олгосон төлбөр."
        actions={<DateRangeFilter />}
      />

      <div className={SEGMENTED}>
        <Link
          href={tabHref("customers")}
          className={segmentCls(tab === "customers")}
        >
          Харилцагч
        </Link>
        <Link
          href={tabHref("herders")}
          className={segmentCls(tab === "herders")}
        >
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
