import { requireCap } from "@/lib/auth/server";
import { can } from "@/lib/auth/roles";
import { SettingsClient } from "./settings-client";
import { AdminsSection } from "./admins-section";

export default async function SettingsPage() {
  const role = await requireCap("settings");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Систем тохиргоо</h1>
        <p className="text-sm text-muted-foreground">
          Telegram-аар автомат мэдэгдэл авах тохиргооны хэсэг.
        </p>
      </div>
      <SettingsClient />
      {can(role, "admins") ? (
        <AdminsSection
          canDelete={can(role, "deleteAdmin")}
          canGrantSuper={role === "SUPER_ADMIN"}
        />
      ) : null}
    </div>
  );
}
