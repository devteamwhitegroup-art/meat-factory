import { requireCap } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { isByproductSite } from "@/lib/factory/factories";
import {
  ShipmentListView,
  type ShipmentCategory,
  type ShipmentListSearchParams,
} from "./_components/ShipmentListView";

type Props = { searchParams: Promise<ShipmentListSearchParams> };

// One shipments page; ?tab=export|domestic switches category (export by
// default). The byproduct site ships domestically only.
export default async function ShipmentsPage({ searchParams }: Props) {
  const session = await requireCap("SHIPMENT_VIEW");
  const factories = await getFactories();
  const sp = await searchParams;
  const categories: ShipmentCategory[] =
    !session.crossFactory && isByproductSite(factories, session.factory)
      ? ["DOMESTIC"]
      : ["EXPORT", "DOMESTIC"];
  const category: ShipmentCategory =
    sp.tab === "domestic" || !categories.includes("EXPORT")
      ? "DOMESTIC"
      : "EXPORT";
  return (
    <ShipmentListView
      category={category}
      categories={categories}
      searchParams={sp}
      crossFactory={session.crossFactory}
      canCreate={session.can("SHIPMENT_MANAGE")}
    />
  );
}
