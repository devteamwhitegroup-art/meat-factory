import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { AdminsSection } from "./admins-section";

// The settings index is the staff tab; accounts without staff rights land on
// the first tab they can open instead.
export default async function SettingsStaffPage() {
  const s = await getSession();
  if (!s.can("STAFF_MANAGE"))
    redirect(s.can("SETTINGS_MANAGE") ? "/settings/factories" : "/settings/animals");
  return <AdminsSection />;
}
