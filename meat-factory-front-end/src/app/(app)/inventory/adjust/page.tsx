import { AdjustForm } from "./adjust-form";
import { requireCap } from "@/lib/auth/server";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";

export default async function AdjustPage() {
  await requireCap("inventoryAdjust");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Нөөц</h1>
      <InventoryTabs />
      <div className="text-sm text-muted-foreground">
        Гар тохируулга — нөөцийн тоо бодит байдалтай нийцэхгүй болсон үед
        ашиглана (ж: гэмтсэн махыг хасах, тооллогын зөрүү засах, тооцоогүй
        орлого нэмэх). Хөдөлгөөн нь «Гар бүртгэл» эх үүсвэртэйгээр түүхэнд
        бичигдэнэ.
      </div>
      <AdjustForm />
    </div>
  );
}
