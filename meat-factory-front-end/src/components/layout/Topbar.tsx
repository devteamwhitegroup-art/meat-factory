"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_MN } from "@/lib/format/enum";
import { useLogout } from "@/lib/auth/useLogout";
import { navIsActive, type NavItem, type StaffRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

// Kiosk shell top bar for operator roles (gate / scale / store). They have no
// sidebar, so nav + role + theme + logout all live here. Office roles use the
// sidebar instead and render no top bar.
export function Topbar({
  role,
  navItems = [],
  brand = "Plant 01",
}: {
  role: StaffRole | null;
  navItems?: NavItem[];
  brand?: string;
}) {
  const pathname = usePathname();
  const logout = useLogout();
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <div className="text-sm font-semibold">{brand}</div>
        <nav className="flex items-center gap-1">
          {navItems.map((i) => {
            const active = navIsActive(pathname, i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "hover:bg-muted",
                )}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>
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
