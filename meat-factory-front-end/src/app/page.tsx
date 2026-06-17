import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';

function landingFor(role: string | null | undefined): string {
  switch (role) {
    case 'GUARD':
      return '/registrations/new';
    case 'SCALE':
      // Scale lands on the in-process pipe (still REGISTERED rows pending
      // weigh-up).
      return '/registrations?stage=registered';
    case 'STOREKEEPER':
      return '/registrations?stage=in_process';
    case 'MODERATOR':
      return '/registrations';
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'MANAGER':
    default:
      return '/dashboard';
  }
}

export default async function RootPage() {
  const jar = await cookies();
  const role = jar.get(env.ROLE_COOKIE_NAME)?.value ?? null;
  redirect(landingFor(role));
}
