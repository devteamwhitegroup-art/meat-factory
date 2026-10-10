import Link from "next/link";
import { getClient } from "@/lib/apollo/server";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { InventoryStockDoc } from "@/lib/queries/inventory";
import { unwrapList } from "@/lib/unwrap";
import {
  BYPRODUCT_FACTORY,
  FACTORY_MN,
  INTAKE_FACTORIES,
} from "@/lib/format/enum";
import { isCrossFactoryRole } from "@/lib/auth/roles";
import { requireCap, sessionFactory } from "@/lib/auth/server";
import { cn } from "@/lib/utils";
import type { Factory } from "@/lib/gql/graphql";
import { TransferForm } from "./transfer-form";

type Props = { searchParams: Promise<{ factory?: string }> };

// Send counted byproducts (гэдэс) from FACTORY_1/2 stock to the byproduct
// factory. Owner/admin pick the sender via ?factory=; staff send from their own
// (BE-scoped, so the stock query needs no factory for them).
export default async function TransferPage({ searchParams }: Props) {
  const role = await requireCap("byproductTransfer");
  const crossFactory = isCrossFactoryRole(role);
  const sp = await searchParams;
  const own = crossFactory ? null : await sessionFactory();
  const from = crossFactory
    ? INTAKE_FACTORIES.includes(sp.factory ?? "")
      ? (sp.factory as Factory)
      : null
    : null;
  const blocked = own === BYPRODUCT_FACTORY;
  const ready = !blocked && (!crossFactory || !!from);

  const { data } = ready
    ? await getClient().query({
        query: InventoryStockDoc,
        variables: {
          factory: from,
          productType: "BYPRODUCT",
          animalId: null,
          byproductName: null,
        },
      })
    : { data: null };
  const { rows, error } = unwrapList(
    data?.inventoryStock,
    data?.inventoryStock?.inventoryItems,
  );
  const items = rows
    .filter((i) => Number(i.quantityCount ?? 0) > 0)
    .map((i) => ({
      id: i.id!,
      label: [i.animal?.name, i.byproductName].filter(Boolean).join(" · "),
      available: Number(i.quantityCount),
    }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        Дайвар илгээх → {FACTORY_MN[BYPRODUCT_FACTORY]}
      </h1>
      <InventoryTabs />
      <div className="text-sm text-muted-foreground">
        Тоолсон гэдсийг дайврын үйлдвэр рүү илгээнэ. Илгээгчийн нөөцөөс
        хасагдаж, дайврын үйлдвэрийн нөөцөд нэмэгдэнэ.
      </div>

      {crossFactory ? (
        <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1">
          {INTAKE_FACTORIES.map((f) => (
            <Link
              key={f}
              href={`/inventory/transfer?factory=${f}`}
              className={cn(
                "inline-flex h-7 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap",
                from === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              {FACTORY_MN[f]}
            </Link>
          ))}
        </div>
      ) : null}

      {blocked ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Дайврын үйлдвэр өөрөө дайвар хүлээн авдаг тул илгээх шаардлагагүй.
        </div>
      ) : !ready ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Илгээх үйлдвэрээ сонгоно уу.
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Илгээх тоолсон дайвар алга
        </div>
      ) : (
        <TransferForm fromFactory={from} items={items} />
      )}
    </div>
  );
}
