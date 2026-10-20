"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout } from "@/lib/auth/useLogout";
import { activeNavHref, type NavItem } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

// Kiosk shell top bar for single-purpose roles. They have no sidebar, so
// nav + user + theme + logout all live here. Other roles use the Shell.
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
  const initials = (name ?? roleName ?? "?").slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-3 backdrop-blur md:px-4">
      <Image
        src="/brand/mark-dark.png"
        alt=""
        width={28}
        height={25}
        priority
        className="dark:invert"
      />
      <div className="hidden text-sm font-semibold tracking-tight sm:block">
        {brand}
      </div>
      <nav className="flex items-center gap-1">
        {navItems.map((i) => {
          const active = i.href === activeHref;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "flex h-8 items-center rounded-md px-2.5 text-sm transition-colors hover:bg-muted",
                active && "bg-muted font-semibold",
              )}
            >
              {i.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-1">
        {name || roleName ? (
          <div className="mr-2 hidden items-center gap-2 sm:flex">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-[11px] text-muted-foreground">
                {roleName}
              </div>
            </div>
          </div>
        ) : null}
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Гарах"
          title="Гарах"
        >
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
