import { requireCap } from "@/lib/auth/server";
import { ShipmentDetailClient } from "./shipment-detail-client";

type Props = { params: Promise<{ id: string }> };

export default async function ShipmentDetailPage({ params }: Props) {
  const session = await requireCap("SHIPMENT_VIEW");
  const { id } = await params;
  return (
    <ShipmentDetailClient
      id={id}
      // Cost / income analytics follow the sales permission (BE-gated too).
      isAdmin={session.can("SHIPMENT_SALES")}
      canEdit={session.can("SHIPMENT_MANAGE")}
      canSales={session.can("SHIPMENT_SALES")}
    />
  );
}
