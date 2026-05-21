import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import {
  isOperatorRole,
  navItemsFor,
  type StaffRole,
} from '@/lib/auth/roles';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const role = (jar.get(env.ROLE_COOKIE_NAME)?.value ?? null) as
    | StaffRole
    | null;

  // Operator roles (gate / scale / store) get a minimal single-purpose shell:
  // no sidebar, a slim top bar with just their task links, and a centered
  // content column with larger targets. Office roles get the full sidebar.
  if (isOperatorRole(role)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Topbar role={role} navItems={navItemsFor(role)} brand="Plant 01" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col">
        <Topbar role={role} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
