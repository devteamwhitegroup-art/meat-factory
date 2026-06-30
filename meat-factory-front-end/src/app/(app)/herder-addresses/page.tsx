import { requireCap } from "@/lib/auth/server";
import { HerderAddressesClient } from "./herder-addresses-client";

export default async function HerderAddressesPage() {
  await requireCap("herderAddresses");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Малчны хаягууд</h1>
        <p className="text-sm text-muted-foreground">
          Малчны бүртгэлд ашиглах хаягийн жагсаалт. «Шинэ малчин» хэсэгт энэ
          жагсаалтаас сонгох болно.
        </p>
      </div>
      <HerderAddressesClient />
    </div>
  );
}
