import { notFound } from "next/navigation";
import { requireCap } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { FACTORY_KIND_MN } from "@/lib/factory/factories";
import { BackButton } from "@/components/common/BackButton";
import { FactoryByproducts } from "./factory-byproducts";

type Props = { params: Promise<{ code: string }> };

export default async function FactoryDetailPage({ params }: Props) {
  await requireCap("SETTINGS_MANAGE");
  const { code } = await params;
  const factory = (await getFactories()).find((f) => f.code === code);
  if (!factory) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/settings/factories" />
        <div>
          <h2 className="text-xl font-semibold">{factory.name}</h2>
          <div className="text-sm text-muted-foreground">
            <span className="font-mono">{factory.code}</span> ·{" "}
            {FACTORY_KIND_MN[factory.kind] ?? factory.kind}
          </div>
        </div>
      </div>
      {factory.kind === "BYPRODUCT" ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Дайврын үйлдвэр мал хүлээн авахгүй тул дайврын үнэ тохируулахгүй.
        </div>
      ) : (
        <FactoryByproducts factory={factory.code} kind={factory.kind} />
      )}
    </div>
  );
}
