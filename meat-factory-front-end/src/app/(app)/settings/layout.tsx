import { NavTabs } from "@/components/common/NavTabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Систем тохиргоо</h1>
        <NavTabs
          tabs={[
            { href: "/settings", label: "Ажилтан" },
            { href: "/settings/stock", label: "Нөөц ба мэдэгдэл" },
            { href: "/settings/printers", label: "Принтер" },
          ]}
        />
      </div>
      {children}
    </div>
  );
}
