import { requireCap } from "@/lib/auth/server";
import { HerderAddressesClient } from "./herder-addresses-client";

export default async function HerderAddressesPage() {
  await requireCap("CATALOG_MANAGE");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Малчны хаягууд</h2>
        <p className="text-sm text-muted-foreground">
          Малчны бүртгэлд ашиглах хаягийн жагсаалт. «Шинэ малчин» хэсэгт энэ
          жагсаалтаас сонгох болно.
        </p>
      </div>
      <HerderAddressesClient />
    </div>
  );
}
