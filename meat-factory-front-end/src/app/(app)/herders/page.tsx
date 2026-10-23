import { HerdersClient } from "./herders-client";
import { requireCap } from "@/lib/auth/server";
import { PageHeader } from "@/components/common/PageHeader";

export default async function HerdersPage() {
  await requireCap("HERDER_MANAGE");
  return (
    <div className="space-y-4">
      <PageHeader
        title="Малчид"
        description="Мал тушаадаг малчдын жагсаалт: утас, регистр, дансны мэдээлэл."
      />
      <HerdersClient />
    </div>
  );
}
