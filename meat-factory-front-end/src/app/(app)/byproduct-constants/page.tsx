import { ByproductConstantsClient } from "./byproduct-constants-client";
import { requireCap } from "@/lib/auth/server";

export default async function ByproductConstantsPage() {
  await requireCap("byproductConstants");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Дайвар норм</h1>
        <p className="text-sm text-muted-foreground">
          Малын төрлөөр багц (ж: Адууны өлөн гэдэс) үүсгэж, дотор нь дайваруудыг
          нэмнэ. Багц нь бой зардал нөхөх эсэхийг агуулна.
        </p>
      </div>
      <ByproductConstantsClient />
    </div>
  );
}
