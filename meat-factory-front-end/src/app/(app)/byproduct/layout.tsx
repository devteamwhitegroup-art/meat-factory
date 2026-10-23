import { getSession } from "@/lib/auth/server";
import type { NavItem } from "@/lib/auth/roles";
import { ByproductTabs } from "./_components/ByproductTabs";
import { PageHeader } from "@/components/common/PageHeader";

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
        <PageHeader
          title="Дайвар"
          description="Гэдэс, дайврын задлалт ба хүлээгдэж буй, бодит гарцын харьцуулалт."
        />
        <ByproductTabs tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
