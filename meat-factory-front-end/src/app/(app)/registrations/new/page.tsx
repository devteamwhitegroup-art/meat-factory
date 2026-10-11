import { IntakeForm } from "./intake-form";
import { BackButton } from "@/components/common/BackButton";
import { redirect } from "next/navigation";
import { requireCap } from "@/lib/auth/server";
import { canCreateRegistration } from "@/lib/auth/roles";
import { getFactories } from "@/lib/factory/server";
import { factoryKind } from "@/lib/factory/factories";

// Force dynamic rendering so the cap check runs on each request.
export const dynamic = "force-dynamic";

export default async function NewRegistrationPage() {
  const session = await requireCap("REGISTRATION_CREATE");
  const factories = await getFactories();
  // Staff get their own factory's form; cross-factory roles pick the factory.
  const factory = session.crossFactory ? null : session.factory;
  if (!canCreateRegistration(session.perms, factoryKind(factories, factory)))
    redirect("/registrations");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href="/registrations" />
        <h1 className="text-2xl font-semibold">Шинэ бүртгэл</h1>
      </div>
      <IntakeForm
        factory={factory}
        quickHerder={!session.can("HERDER_EDIT")}
      />
    </div>
  );
}
