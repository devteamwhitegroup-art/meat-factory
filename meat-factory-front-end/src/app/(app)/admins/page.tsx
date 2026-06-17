import { requireCap } from '@/lib/auth/server';

export default async function AdminsPlaceholder() {
  await requireCap('admins');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Хэрэглэгч</h1>
      <p className="text-muted-foreground">Hereafter (later).</p>
    </div>
  );
}
