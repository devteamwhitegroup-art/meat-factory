import { IntakeForm } from "./intake-form";
import { redirect } from "next/navigation";
import { requireCap } from "@/lib/auth/server";
import { canCreateRegistration } from "@/lib/auth/roles";
import { getFactories } from "@/lib/factory/server";
import { factoryKind } from "@/lib/factory/factories";
import { PageHeader } from "@/components/common/PageHeader";

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
      <PageHeader
        back="/registrations"
        title="Шинэ бүртгэл"
        description="Машины дугаар, малчин, мал (эсвэл мах)-ыг оруулж, гарын үсэг зуруулаад доод талын «Бүртгэх» товчийг дарна."
      />
      <IntakeForm
        factory={factory}
        quickHerder={!session.can("HERDER_EDIT")}
      />
    </div>
  );
}
