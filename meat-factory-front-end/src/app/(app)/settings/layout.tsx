import { NavTabs, type NavTab } from "@/components/common/NavTabs";
import { getSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/common/PageHeader";

// Each tab is its own page gated by requireCap; the layout only hides the
// tabs this account can't open.
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSession();
  const tabs: NavTab[] = [
    ...(s.can("STAFF_MANAGE")
      ? [
          { href: "/settings", label: "Ажилтан" },
          { href: "/settings/roles", label: "Эрх" },
        ]
      : []),
    ...(s.can("SETTINGS_MANAGE")
      ? [
          { href: "/settings/factories", label: "Үйлдвэр" },
          { href: "/settings/stock", label: "Нөөц ба мэдэгдэл" },
          { href: "/settings/printers", label: "Принтер" },
        ]
      : []),
    ...(s.can("CATALOG_MANAGE")
      ? [
          { href: "/settings/animals", label: "Мал" },
          { href: "/settings/byproduct", label: "Дайвар" },
          { href: "/settings/herder-addresses", label: "Малчны хаяг" },
        ]
      : []),
  ];
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <PageHeader
          title="Систем тохиргоо"
          description="Ажилтан, эрх, үйлдвэр, мал, дайврын тохиргоо. Өөрчлөлт бүх хэрэглэгчид шууд хүчинтэй."
        />
        <NavTabs tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
