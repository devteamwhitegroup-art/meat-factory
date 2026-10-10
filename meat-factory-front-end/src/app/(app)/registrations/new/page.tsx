import { IntakeForm } from "./intake-form";
import { BackButton } from "@/components/common/BackButton";
import { requireCap, sessionFactory } from "@/lib/auth/server";
import { isCrossFactoryRole } from "@/lib/auth/roles";

// Force dynamic rendering so the cap check runs on each request.
export const dynamic = "force-dynamic";

export default async function NewRegistrationPage() {
  const role = await requireCap("createRegistration");
  // Staff get their own factory's form; owner/admin pick the factory.
  const factory = isCrossFactoryRole(role) ? null : await sessionFactory();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href="/registrations" />
        <h1 className="text-2xl font-semibold">Шинэ бүртгэл</h1>
      </div>
      <IntakeForm factory={factory} />
    </div>
  );
}
