"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  FilePenLine,
  Handshake,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  Stethoscope,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout } from "@/lib/auth/useLogout";
import { activeNavHref, type NavItem } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

// Icon per top-level route. roles.ts is shared with the server and stays
// icon-free.
const ICONS: Record<string, LucideIcon> = {
  "/": House,
  "/dashboard": LayoutDashboard,
  "/registrations": ClipboardList,
  "/medical-numbers": Stethoscope,
  "/sales": Receipt,
  "/byproduct": Package,
  "/inventory": Warehouse,
  "/shipments": Truck,
  "/herders": Users,
  "/customers": Handshake,
  "/change-requests": FilePenLine,
  "/settings": Settings,
};

type UserProps = {
  brand: string;
  name: string | null;
  roleName: string | null;
};

// One layout for every role, so nobody has to learn two: a dark, always
// labelled menu on the left (desktop), or a big «Цэс» button that slides the
// same menu in (tablet / phone). No icon-only states.
export function Shell({
  items,
  children,
  ...user
}: UserProps & {
  items: NavItem[];
  children: React.ReactNode;
}) {
  const activeHref = activeNavHref(items, usePathname(), useSearchParams());
  const title = items.find((i) => i.href === activeHref)?.label ?? "";
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarNav items={items} activeHref={activeHref} {...user} />
      </aside>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="gap-0 border-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-72"
        >
          <SheetTitle className="sr-only">Цэс</SheetTitle>
          <SidebarNav
            items={items}
            activeHref={activeHref}
            onNavigate={() => setDrawer(false)}
            {...user}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur print:hidden lg:hidden">
          <Button variant="outline" onClick={() => setDrawer(true)}>
            <Menu />
            Цэс
          </Button>
          <div className="min-w-0 flex-1 truncate text-lg font-semibold">
            {title}
          </div>
          <Image
            src="/brand/mark-dark.png"
            alt="Вайт Групп"
            width={32}
            height={28}
            priority
            className="dark:invert"
          />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarNav({
  items,
  activeHref,
  onNavigate,
  brand,
  name,
  roleName,
}: UserProps & {
  items: NavItem[];
  activeHref: string | null;
  onNavigate?: () => void;
}) {
  const logout = useLogout();
  // Groups in first-appearance order, so a reordered menu (byproduct sites)
  // still leads with its own work.
  const groups: { label: string; items: NavItem[] }[] = [];
  for (const i of items) {
    const label = i.group ?? "";
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(i);
    else groups.push({ label, items: [i] });
  }
  const initials = (name ?? roleName ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
        <Image
          src="/brand/mark-dark.png"
          alt=""
          width={36}
          height={32}
          priority
          className="invert"
        />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-base font-bold text-white">
            Вайт Групп
          </div>
          <div className="truncate text-sm text-sidebar-foreground/70">
            {brand}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map((g) => (
          <div key={g.label}>
            {g.label ? (
              <div className="px-3 pb-2 text-xs font-semibold text-sidebar-foreground/55">
                {g.label}
              </div>
            ) : null}
            <ul className="space-y-1">
              {g.items.map((i) => {
                const Icon = ICONS[i.href.split("?")[0]];
                const active = i.href === activeHref;
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      {Icon ? <Icon className="size-5 shrink-0" /> : null}
                      <span className="truncate">{i.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-semibold text-white">
              {name ?? "—"}
            </div>
            {roleName ? (
              <div className="truncate text-sm text-sidebar-foreground/70">
                {roleName}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={logout}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-sidebar-border text-[15px] font-semibold transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-5" />
            Гарах
          </button>
          <ThemeToggle className="border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent" />
        </div>
      </div>
    </div>
  );
}
