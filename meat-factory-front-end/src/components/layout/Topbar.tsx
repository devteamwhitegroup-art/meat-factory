'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ROLE_MN } from '@/lib/format/enum';
import type { NavItem } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

export function Topbar({
  role,
  navItems = [],
  brand = 'FactoryOS',
}: {
  role: string | null;
  navItems?: NavItem[];
  brand?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <div className="text-sm font-semibold">{brand}</div>
        {navItems.length > 0 ? (
          <nav className="flex items-center gap-1">
            {navItems.map((i) => {
              const path = i.href.split('?')[0];
              const active =
                pathname === path || pathname.startsWith(path + '/');
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'hover:bg-muted',
                  )}
                >
                  {i.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-sm">
        {role ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {ROLE_MN[role] ?? role}
          </span>
        ) : null}
        <ThemeToggle />
        <Button variant="outline" size="sm" onClick={logout}>
          Гарах
        </Button>
      </div>
    </header>
  );
}
