import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { FACTORY_COOKIE } from "@/lib/auth/server";

export async function POST() {
  const jar = await cookies();
  jar.delete(env.AUTH_COOKIE_NAME);
  jar.delete(env.ROLE_COOKIE_NAME);
  jar.delete(FACTORY_COOKIE);
  return Response.json({ ok: true });
}
