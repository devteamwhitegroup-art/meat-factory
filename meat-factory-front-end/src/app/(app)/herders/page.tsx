import { HerdersClient } from './herders-client';

export default function HerdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Малчид</h1>
      <HerdersClient />
    </div>
  );
}
