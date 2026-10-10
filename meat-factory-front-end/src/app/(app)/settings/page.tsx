import { requireCap } from "@/lib/auth/server";
import { AdminsSection } from "./admins-section";

export default async function SettingsStaffPage() {
  await requireCap("settings");
  return <AdminsSection />;
}
