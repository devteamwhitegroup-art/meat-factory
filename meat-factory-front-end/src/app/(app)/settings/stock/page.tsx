import { requireCap } from "@/lib/auth/server";
import { StockSettings } from "../settings-client";

export default async function SettingsStockPage() {
  await requireCap("settings");
  return <StockSettings />;
}
