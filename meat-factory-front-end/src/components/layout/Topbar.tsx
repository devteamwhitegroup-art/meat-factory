"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout } from "@/lib/auth/useLogout";
import { activeNavHref, type NavItem } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

// Kiosk shell top bar for single-purpose roles. They have no sidebar, so
// nav + role + theme + logout all live here. Other roles use the sidebar
// instead and render no top bar.
export function Topbar({
  roleName,
  name = null,
  navItems = [],
  brand,
}: {
  roleName: string | null;
  name?: string | null;
  navItems?: NavItem[];
  brand: string;
}) {
  const activeHref = activeNavHref(navItems, usePathname(), useSearchParams());
  const logout = useLogout();
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <div className="text-sm font-semibold">{brand}</div>
        <nav className="flex items-center gap-1">
          {navItems.map((i) => {
            const active = i.href === activeHref;
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
        {roleName || name ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {roleName}
            {name ? (
              <span className="font-medium text-foreground">
                {roleName ? " · " : ""}
                {name}
              </span>
            ) : null}
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
