import { CustomersClient } from './customers-client';

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Харилцагч</h1>
      <CustomersClient />
    </div>
  );
}
