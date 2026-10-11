import Link from "next/link";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
import { getClient } from "@/lib/apollo/server";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { InventoryStockDoc } from "@/lib/queries/inventory";
import { unwrapList } from "@/lib/unwrap";
import { requireCap } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import {
  byproductFactories,
  intakeFactories,
  isByproductSite,
} from "@/lib/factory/factories";
import { TransferForm } from "./transfer-form";

type Props = { searchParams: Promise<{ factory?: string }> };

// Send counted byproducts (гэдэс) from an intake site's stock to the
// byproduct site. Cross-factory roles pick the sender via ?factory=; staff
// send from their own (BE-scoped, so the stock query needs no factory for them).
export default async function TransferPage({ searchParams }: Props) {
  const session = await requireCap("BYPRODUCT_TRANSFER");
  const factories = await getFactories();
  const crossFactory = session.crossFactory;
  const senders = intakeFactories(factories);
  const target = byproductFactories(factories)
    .map((f) => f.name)
    .join(" / ");
  const sp = await searchParams;
  const from =
    crossFactory && senders.some((f) => f.code === sp.factory)
      ? (sp.factory as string)
      : null;
  const blocked = !crossFactory && isByproductSite(factories, session.factory);
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
      <h1 className="text-2xl font-semibold">Дайвар илгээх → {target}</h1>
      <InventoryTabs />
      <div className="text-sm text-muted-foreground">
        Тоолсон гэдсийг дайврын үйлдвэр рүү илгээнэ. Илгээгчийн нөөцөөс
        хасагдаж, дайврын үйлдвэрийн нөөцөд нэмэгдэнэ.
      </div>

      {crossFactory ? (
        <div className={SEGMENTED}>
          {senders.map((f) => (
            <Link
              key={f.code}
              href={`/inventory/transfer?factory=${f.code}`}
              className={segmentCls(from === f.code)}
            >
              {f.name}
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
