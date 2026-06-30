import { ShipmentDetailClient } from "./shipment-detail-client";

type Props = { params: Promise<{ id: string }> };

export default async function ShipmentDetailPage({ params }: Props) {
  const { id } = await params;
  return <ShipmentDetailClient id={id} />;
}
