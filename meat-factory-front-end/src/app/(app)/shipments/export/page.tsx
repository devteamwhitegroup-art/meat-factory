import { requireCap } from '@/lib/auth/server';
import {
  ShipmentListView,
  type ShipmentListSearchParams,
} from '../_components/ShipmentListView';

type Props = { searchParams: Promise<ShipmentListSearchParams> };

export default async function ExportShipmentsPage({ searchParams }: Props) {
  await requireCap('shipments');
  const sp = await searchParams;
  return <ShipmentListView category="EXPORT" searchParams={sp} />;
}
