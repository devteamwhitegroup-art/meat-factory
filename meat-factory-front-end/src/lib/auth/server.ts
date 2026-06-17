import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { can, type Capability } from './roles';

// Server-side page gate. Reads the `mf_role` cookie (set at login) and
// redirects to `/` (which routes the user to their role-appropriate home) if
// the role lacks the required capability. The back-end @auth directive is
// still the real boundary — this is UX guarding so users don't load screens
// they can't act on.
export async function requireCap(cap: Capability): Promise<void> {
  const jar = await cookies();
  const role = jar.get(env.ROLE_COOKIE_NAME)?.value ?? null;
  if (!can(role, cap)) redirect('/');
}
