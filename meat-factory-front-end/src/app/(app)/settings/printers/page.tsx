import { requireCap } from "@/lib/auth/server";
import { PrinterSettings } from "../settings-client";

export default async function SettingsPrintersPage() {
  await requireCap("SETTINGS_MANAGE");
  return <PrinterSettings />;
}
