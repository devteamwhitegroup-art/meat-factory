import { NewShipmentForm } from "../../_components/NewShipmentForm";
import { BackButton } from "@/components/common/BackButton";
import { requireCap } from "@/lib/auth/server";

export default async function NewExportShipmentPage() {
  await requireCap("shipments");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/shipments/export" />
        <h1 className="text-2xl font-semibold">Шинэ экспорт ачилт</h1>
      </div>
      <NewShipmentForm category="EXPORT" />
    </div>
  );
}
