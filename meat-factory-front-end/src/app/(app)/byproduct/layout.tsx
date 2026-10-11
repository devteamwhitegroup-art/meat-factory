import { getSession } from "@/lib/auth/server";
import type { NavItem } from "@/lib/auth/roles";
import { ByproductTabs } from "./_components/ByproductTabs";

// One section for byproducts: disassembly batches and their
// expected-vs-actual analytics. The norm catalogue (categories / prices) is
// admin setup → Систем тохиргоо › Дайвар. Each page gates itself.
export default async function ByproductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const tabs: NavItem[] = [
    ...(session.can("BYPRODUCT_PROCESS")
      ? [
          { href: "/byproduct", label: "Задлалт" },
          { href: "/byproduct/analytics", label: "Шинжилгээ" },
        ]
      : []),
  ];
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Дайвар</h1>
        <ByproductTabs tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
