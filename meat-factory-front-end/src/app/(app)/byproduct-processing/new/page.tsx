import { BackButton } from "@/components/common/BackButton";
import { requireCap } from "@/lib/auth/server";
import { ProcessingForm } from "../_components/ProcessingForm";

export const dynamic = "force-dynamic";

export default async function NewByproductProcessingPage() {
  await requireCap("byproductProcessing");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href="/byproduct-processing" />
        <h1 className="text-2xl font-semibold">Шинэ задлалт</h1>
      </div>
      <ProcessingForm />
    </div>
  );
}
