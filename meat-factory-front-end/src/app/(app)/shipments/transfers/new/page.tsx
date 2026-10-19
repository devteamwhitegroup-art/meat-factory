import Link from "next/link";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
import { BackButton } from "@/components/common/BackButton";
import { getClient } from "@/lib/apollo/server";
import { requireCap } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { InventoryStockDoc } from "@/lib/queries/inventory";
import { unwrapList } from "@/lib/unwrap";
import { transferLineText } from "../_components/transfer-line";
import { TransferSendForm } from "../_components/TransferSendForm";

type Props = { searchParams: Promise<{ factory?: string }> };

// Send meat / byproducts from one factory's stock to another. Staff send
// from their own factory; cross-factory roles pick the sender via ?factory=.
export default async function NewFactoryTransferPage({ searchParams }: Props) {
  const session = await requireCap("SHIPMENT_MANAGE");
  const active = (await getFactories()).filter((f) => f.isActive);
  const sp = await searchParams;
  const from = session.crossFactory
    ? (active.find((f) => f.code === sp.factory)?.code ?? null)
    : session.factory;

  const { data } = from
    ? await getClient().query({
        query: InventoryStockDoc,
        variables: {
          factory: from,
          productType: null,
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
    .map((i) => ({
      id: i.id!,
      label: transferLineText({ ...i, quantityKg: 0, quantityCount: 0 }),
      kg: Number(i.quantityKg ?? 0),
      count: Number(i.quantityCount ?? 0),
    }))
    .filter((i) => i.kg > 0 || i.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <BackButton href="/shipments/transfers" />
        <h1 className="text-2xl font-semibold">Үйлдвэр хооронд илгээх</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Илгээмэгц таны нөөцөөс хасагдана. Хүлээн авах үйлдвэр баталгаажуулахад
        тэдний нөөцөд нэмэгдэнэ.
      </p>

      {session.crossFactory ? (
        <div className={SEGMENTED}>
          {active.map((f) => (
            <Link
              key={f.code}
              href={`/shipments/transfers/new?factory=${f.code}`}
              className={segmentCls(from === f.code)}
            >
              {f.name}
            </Link>
          ))}
        </div>
      ) : null}

      {!from ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Илгээх үйлдвэрээ сонгоно уу.
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Илгээх нөөц алга
        </div>
      ) : (
        <TransferSendForm
          fromFactory={from}
          destinations={active
            .filter((f) => f.code !== from)
            .map((f) => ({ code: f.code, name: f.name }))}
          items={items}
        />
      )}
    </div>
  );
}
