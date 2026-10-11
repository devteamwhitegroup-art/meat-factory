import { redirect } from "next/navigation";
import { landingFor } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { factoryKind } from "@/lib/factory/factories";

// Routes a signed-in account to its first menu item (byproduct-site staff →
// Дайвар). Unauthenticated visitors never reach this — proxy.ts sends them
// to /login.
export default async function RootPage() {
  const [s, factories] = await Promise.all([getSession(), getFactories()]);
  redirect(landingFor(s.perms, factoryKind(factories, s.factory)));
}
