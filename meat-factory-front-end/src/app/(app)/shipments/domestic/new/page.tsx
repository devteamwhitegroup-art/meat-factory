import { NewShipmentForm } from "../../_components/NewShipmentForm";
import { requireCap } from "@/lib/auth/server";
import { PageHeader } from "@/components/common/PageHeader";

export default async function NewDomesticShipmentPage() {
  const session = await requireCap("SHIPMENT_MANAGE");
  return (
    <div className="space-y-4">
      <PageHeader
        back="/shipments?tab=domestic"
        title="Шинэ дотоод ачилт"
        description="Дотоодын харилцагч руу гарах ачилтыг бүртгэнэ."
      />
      <NewShipmentForm
        category="DOMESTIC"
        crossFactory={session.crossFactory}
      />
    </div>
  );
}
