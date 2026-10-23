import { NewSaleForm } from "./new-sale-form";
import { requireCap } from "@/lib/auth/server";
import { PageHeader } from "@/components/common/PageHeader";

export default async function NewSalePage() {
  await requireCap("SALES_MANAGE");
  return (
    <div className="space-y-4">
      <PageHeader
        back="/sales"
        title="Шинэ гүйлгээ"
        description="Харилцагч, бараа, тоо хэмжээ, үнийг оруулаад хадгална."
      />
      <NewSaleForm />
    </div>
  );
}
