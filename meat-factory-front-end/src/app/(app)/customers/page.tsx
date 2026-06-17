import { CustomersClient } from './customers-client';
import { requireCap } from '@/lib/auth/server';

export default async function CustomersPage() {
  await requireCap('customers');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Харилцагч</h1>
      <CustomersClient />
    </div>
  );
}
