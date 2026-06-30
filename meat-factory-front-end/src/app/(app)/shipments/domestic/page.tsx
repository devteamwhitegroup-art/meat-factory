import { requireCap } from "@/lib/auth/server";
import {
  ShipmentListView,
  type ShipmentListSearchParams,
} from "../_components/ShipmentListView";

type Props = { searchParams: Promise<ShipmentListSearchParams> };

export default async function DomesticShipmentsPage({ searchParams }: Props) {
  await requireCap("shipments");
  const sp = await searchParams;
  return <ShipmentListView category="DOMESTIC" searchParams={sp} />;
}
