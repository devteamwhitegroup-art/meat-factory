import { NewSaleForm } from './new-sale-form';
import { requireCap } from '@/lib/auth/server';

export default async function NewSalePage() {
  await requireCap('sales');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Шинэ гүйлгээ</h1>
      <NewSaleForm />
    </div>
  );
}
