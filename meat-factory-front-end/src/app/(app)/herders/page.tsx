import { HerdersClient } from "./herders-client";
import { requireCap } from "@/lib/auth/server";

export default async function HerdersPage() {
  await requireCap("HERDER_MANAGE");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Малчид</h1>
      <HerdersClient />
    </div>
  );
}
