import { requireCap } from '@/lib/auth/server';
import { SettingsClient } from './settings-client';

export default async function SettingsPage() {
  await requireCap('settings');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Систем тохиргоо</h1>
        <p className="text-sm text-muted-foreground">
          Махны нөөц багтаамж, мэдэгдлийн босго, нэг ачааны багтаамжийг
          тохируулна. Босго давсан үед Telegram-аар автомат мэдэгдэл явна.
        </p>
      </div>
      <SettingsClient />
    </div>
  );
}
