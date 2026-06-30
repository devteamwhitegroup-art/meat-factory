import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function GET() {
  const jar = await cookies();
  const role = jar.get(env.ROLE_COOKIE_NAME)?.value ?? null;
  const authed = !!jar.get(env.AUTH_COOKIE_NAME)?.value;
  return Response.json({ ok: true, authed, role });
}
