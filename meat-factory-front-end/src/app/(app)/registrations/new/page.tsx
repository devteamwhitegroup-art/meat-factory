import { IntakeForm } from "./intake-form";
import { BackButton } from "@/components/common/BackButton";
import { requireCap } from "@/lib/auth/server";

// Force dynamic rendering so the cap check runs on each request.
export const dynamic = "force-dynamic";

export default async function NewRegistrationPage() {
  await requireCap("createRegistration");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href="/registrations" />
        <h1 className="text-2xl font-semibold">Шинэ бүртгэл</h1>
      </div>
      <IntakeForm />
    </div>
  );
}
