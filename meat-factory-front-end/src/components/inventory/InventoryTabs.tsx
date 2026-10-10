import { NavTabs } from "@/components/common/NavTabs";

export function InventoryTabs() {
  return (
    <NavTabs
      tabs={[
        { href: "/inventory", label: "Нөөц" },
        { href: "/inventory/movements", label: "Хөдөлгөөн" },
        { href: "/inventory/adjust", label: "Тохируулга" },
      ]}
    />
  );
}
