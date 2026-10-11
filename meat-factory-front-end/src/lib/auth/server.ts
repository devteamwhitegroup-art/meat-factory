import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { can, PERMS_COOKIE, type Permission } from "./roles";

// Staff's factory code, set at login; absent for cross-factory roles, who
// span every site. Picks which intake/weigh form a user gets.
export const FACTORY_COOKIE = "mf_factory";
// Staff login name (Admin.param), shown beside the role in the shell.
export const NAME_COOKIE = "mf_name";
export { PERMS_COOKIE };

export type Session = {
  perms: string[];
  roleName: string | null;
  name: string | null;
  // The account's site; null = cross-factory role.
  factory: string | null;
  crossFactory: boolean;
  can: (...anyOf: Permission[]) => boolean;
};

// Everything the shell and pages need about the signed-in account, from the
// login cookies. The back-end re-checks every request — this is UX gating.
export async function getSession(): Promise<Session> {
  const jar = await cookies();
  const perms = (jar.get(PERMS_COOKIE)?.value ?? "")
    .split(",")
    .filter(Boolean);
  const factory = jar.get(FACTORY_COOKIE)?.value || null;
  return {
    perms,
    roleName: jar.get(env.ROLE_COOKIE_NAME)?.value || null,
    name: jar.get(NAME_COOKIE)?.value || null,
    factory,
    // A factory-bound role always carries a factory (BE-enforced), so no
    // factory ⇔ cross-factory.
    crossFactory: !factory,
    can: (...anyOf) => can(perms, ...anyOf),
  };
}

// Server-side page gate: redirects to `/` (which routes to the account's
// landing page) unless the account holds ANY of the permissions.
export async function requireCap(...anyOf: Permission[]): Promise<Session> {
  const s = await getSession();
  if (!s.can(...anyOf)) redirect("/");
  return s;
}
