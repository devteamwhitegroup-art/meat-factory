import { ByproductConstantsClient } from "./byproduct-constants-client";
import { requireCap } from "@/lib/auth/server";

export default async function ByproductConstantsPage() {
  await requireCap("CATALOG_MANAGE");
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Малын төрлөөр багц (ж: Адууны өлөн гэдэс) үүсгэж, дотор нь дайваруудыг
          нэмнэ. Үнийг үйлдвэр бүр өөрөө тохируулна (Систем тохиргоо ›
          Үйлдвэр).
        </p>
      </div>
      <ByproductConstantsClient />
    </div>
  );
}
