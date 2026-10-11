import { AdjustForm } from "./adjust-form";
import { requireCap } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";

type Props = { searchParams: Promise<{ factory?: string }> };

export default async function AdjustPage({ searchParams }: Props) {
  const session = await requireCap("INVENTORY_ADJUST");
  const factories = await getFactories();
  // Cross-factory roles: the factory chosen in the header filter (layout).
  const sp = await searchParams;
  const factory = factories.some((f) => f.code === sp.factory)
    ? (sp.factory as string)
    : null;
  return (
    <>
      <div className="text-sm text-muted-foreground">
        Гар тохируулга — нөөцийн тоо бодит байдалтай нийцэхгүй болсон үед
        ашиглана (ж: гэмтсэн махыг хасах, тооллогын зөрүү засах, тооцоогүй
        орлого нэмэх). Хөдөлгөөн нь «Гар бүртгэл» эх үүсвэртэйгээр түүхэнд
        бичигдэнэ.
      </div>
      <AdjustForm crossFactory={session.crossFactory} factory={factory} />
    </>
  );
}
