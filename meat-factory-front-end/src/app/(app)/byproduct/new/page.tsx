import { BackButton } from "@/components/common/BackButton";
import { requireCap } from "@/lib/auth/server";
import { ProcessingForm } from "../_components/ProcessingForm";

export const dynamic = "force-dynamic";

export default async function NewByproductProcessingPage() {
  await requireCap("BYPRODUCT_PROCESS");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href="/byproduct" />
        <h2 className="text-xl font-semibold">Шинэ задлалт</h2>
      </div>
      <ProcessingForm />
    </div>
  );
}
