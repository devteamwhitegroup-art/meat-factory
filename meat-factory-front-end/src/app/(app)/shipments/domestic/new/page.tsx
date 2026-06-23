import { NewShipmentForm } from "../../_components/NewShipmentForm";
import { BackButton } from "@/components/common/BackButton";
import { requireCap } from "@/lib/auth/server";

export default async function NewDomesticShipmentPage() {
  await requireCap("shipments");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/shipments/domestic" />
        <h1 className="text-2xl font-semibold">Шинэ дотоод ачилт</h1>
      </div>
      <NewShipmentForm category="DOMESTIC" />
    </div>
  );
}
