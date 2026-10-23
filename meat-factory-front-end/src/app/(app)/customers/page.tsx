import { CustomersClient } from "./customers-client";
import { requireCap } from "@/lib/auth/server";
import { PageHeader } from "@/components/common/PageHeader";

export default async function CustomersPage() {
  await requireCap("CUSTOMER_MANAGE");
  return (
    <div className="space-y-4">
      <PageHeader
        title="Харилцагч"
        description="Мах, дайвар худалдан авдаг брокер болон үйлдвэрүүд."
      />
      <CustomersClient />
    </div>
  );
}
