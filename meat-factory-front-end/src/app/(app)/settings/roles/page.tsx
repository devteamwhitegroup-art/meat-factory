import { requireCap } from "@/lib/auth/server";
import { RolesSection } from "../roles-section";

export default async function SettingsRolesPage() {
  await requireCap("STAFF_MANAGE");
  return <RolesSection />;
}
