import { NewShipmentForm } from "../../_components/NewShipmentForm";
import { requireCap } from "@/lib/auth/server";
import { PageHeader } from "@/components/common/PageHeader";

export default async function NewExportShipmentPage() {
  const session = await requireCap("SHIPMENT_MANAGE");
  return (
    <div className="space-y-4">
      <PageHeader
        back="/shipments?tab=export"
        title="Шинэ экспорт ачилт"
        description="Гадаад руу гарах ачилтыг бүртгэнэ."
      />
      <NewShipmentForm
        category="EXPORT"
        crossFactory={session.crossFactory}
      />
    </div>
  );
}
