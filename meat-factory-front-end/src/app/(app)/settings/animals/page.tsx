import { AnimalsClient } from "./animals-client";
import { requireCap } from "@/lib/auth/server";

export default async function AnimalsPage() {
  await requireCap("CATALOG_MANAGE");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Малын тохиргоо</h2>
        <p className="text-sm text-muted-foreground">
          Малын төрөл тус бүрд бой зардал (1 толгойн үнэ) болон дайвараа малчинд
          үлдээж бой зардлыг нөхөх боломжтой эсэхийг тохируулна.
        </p>
      </div>
      <AnimalsClient />
    </div>
  );
}
