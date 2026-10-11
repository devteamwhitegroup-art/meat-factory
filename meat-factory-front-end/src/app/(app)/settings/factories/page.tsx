import { requireCap } from "@/lib/auth/server";
import { FactoriesSection } from "../factories-section";

export default async function SettingsFactoriesPage() {
  await requireCap("SETTINGS_MANAGE");
  return <FactoriesSection />;
}
