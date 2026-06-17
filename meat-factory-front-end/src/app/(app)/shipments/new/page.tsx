import { NewShipmentForm } from './new-shipment-form';
import { requireCap } from '@/lib/auth/server';

export default async function NewShipmentPage() {
  await requireCap('shipments');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Шинэ ачилт</h1>
      <NewShipmentForm />
    </div>
  );
}
