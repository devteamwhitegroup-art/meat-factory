import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export async function POST() {
  const jar = await cookies();
  jar.delete(env.AUTH_COOKIE_NAME);
  jar.delete(env.ROLE_COOKIE_NAME);
  return Response.json({ ok: true });
}
