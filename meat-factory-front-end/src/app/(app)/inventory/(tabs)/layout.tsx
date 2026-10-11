import { getSession } from "@/lib/auth/server";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { FactoryFilter } from "@/components/common/FactoryFilter";

// Shared header for the Нөөц / Хөдөлгөөн / Тохируулга tabs: title, tabs and
// (cross-factory roles) the factory filter that all three read from
// ?factory=. Each page still gates itself with requireCap.
// /inventory/transfer stays outside — it has its own source-factory switch.
export default async function InventoryTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Нөөц</h1>
      <div className="flex flex-wrap items-center gap-3">
        <InventoryTabs />
        {session.crossFactory ? <FactoryFilter /> : null}
      </div>
      {children}
    </div>
  );
}
