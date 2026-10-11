import { getSession } from "@/lib/auth/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function GET() {
  const s = await getSession();
  const authed = !!(await cookies()).get(env.AUTH_COOKIE_NAME)?.value;
  return Response.json({
    ok: true,
    authed,
    role: s.roleName,
    permissions: s.perms,
    factory: s.factory,
  });
}
