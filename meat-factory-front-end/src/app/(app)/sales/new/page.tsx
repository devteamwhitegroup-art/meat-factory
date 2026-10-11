import { NewSaleForm } from "./new-sale-form";
import { BackButton } from "@/components/common/BackButton";
import { requireCap } from "@/lib/auth/server";

export default async function NewSalePage() {
  await requireCap("SALES_MANAGE");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton href="/sales" />
        <h1 className="text-2xl font-semibold">Шинэ гүйлгээ</h1>
      </div>
      <NewSaleForm />
    </div>
  );
}
