import { requireCap } from "@/lib/auth/server";
import { isCrossFactoryRole } from "@/lib/auth/roles";
import {
  ShipmentListView,
  type ShipmentListSearchParams,
} from "../_components/ShipmentListView";

type Props = { searchParams: Promise<ShipmentListSearchParams> };

export default async function ExportShipmentsPage({ searchParams }: Props) {
  const role = await requireCap("shipments");
  const sp = await searchParams;
  return (
    <ShipmentListView
      category="EXPORT"
      searchParams={sp}
      crossFactory={isCrossFactoryRole(role)}
    />
  );
}
