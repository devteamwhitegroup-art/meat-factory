"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  FilePenLine,
  Handshake,
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeft,
  Receipt,
  Settings,
  Stethoscope,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout } from "@/lib/auth/useLogout";
import { activeNavHref, type NavItem } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

// Icon per top-level route. roles.ts is shared with the server and stays
// icon-free.
const ICONS: Record<string, LucideIcon> = {
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

// Office shell: grouped icon sidebar (collapses to an icon rail on desktop,
// slides in as a drawer on mobile) + slim header with the page title.
export function Shell({
  items,
  defaultCollapsed = false,
  children,
  ...user
}: UserProps & {
  items: NavItem[];
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeHref = activeNavHref(items, pathname, useSearchParams());
  const title = items.find((i) => i.href === activeHref)?.label ?? "";
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawer, setDrawer] = useState(false);
  const logout = useLogout();

  function toggle() {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setDrawer(true);
      return;
    }
    setCollapsed((c) => {
      const next = !c;
      try {
        // Cheap UI-only pref; read back by AppShell so the first paint after a
        // reload already has the right width (no flash).
        document.cookie = `mf_sidebar=${next ? "1" : "0"};path=/;max-age=31536000;samesite=lax`;
      } catch {
        /* cookies disabled: the toggle still works for this session */
      }
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-12" : "w-60",
        )}
      >
        <SidebarNav
          items={items}
          activeHref={activeHref}
          collapsed={collapsed}
          {...user}
        />
      </aside>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="gap-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-60"
        >
          <SheetTitle className="sr-only">Цэс</SheetTitle>
          <SidebarNav
            items={items}
            activeHref={activeHref}
            collapsed={false}
            onNavigate={() => setDrawer(false)}
            {...user}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label="Цэс"
            title="Цэс"
          >
            <PanelLeft />
          </Button>
          <div className="truncate text-sm font-semibold tracking-tight">
            {title}
          </div>
          <div className="ml-auto flex items-center gap-1">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({
  items,
  activeHref,
  collapsed,
  onNavigate,
  brand,
  name,
  roleName,
}: UserProps & {
  items: NavItem[];
  activeHref: string | null;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
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
    <>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b",
          collapsed ? "justify-center" : "px-4",
        )}
      >
        <Image
          src="/brand/mark-dark.png"
          alt=""
          width={28}
          height={25}
          priority
          className="dark:invert"
        />
        {collapsed ? null : (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold">Вайт Групп</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {brand}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((g) => (
          <div key={g.label} className="px-2 py-1">
            {collapsed || !g.label ? null : (
              <div className="flex h-8 items-center px-2 text-[11px] font-medium tracking-wider text-sidebar-foreground/70">
                {g.label}
              </div>
            )}
            <ul className="flex flex-col gap-1">
              {g.items.map((i) => {
                const Icon = ICONS[i.href.split("?")[0]];
                const active = i.href === activeHref;
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onNavigate}
                      title={collapsed ? i.label : undefined}
                      className={cn(
                        "relative flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0",
                        active &&
                          "bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:top-2 before:left-0 before:h-4 before:w-0.5 before:rounded-r-full before:bg-sidebar-foreground",
                      )}
                    >
                      {Icon ? <Icon className="size-4 shrink-0" /> : null}
                      {collapsed ? null : (
                        <span className="truncate">{i.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-t p-2",
          collapsed && "justify-center",
        )}
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground"
          title={collapsed ? (name ?? roleName ?? undefined) : undefined}
        >
          {initials}
        </div>
        {collapsed ? null : (
          <div className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-sm font-medium">{name ?? "—"}</span>
            {roleName ? (
              <Badge className="mt-0.5 h-4 px-1.5 text-[10px]">
                {roleName}
              </Badge>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
