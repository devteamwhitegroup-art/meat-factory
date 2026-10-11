"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useLogout } from "@/lib/auth/useLogout";
import { activeNavHref, type NavItem } from "@/lib/auth/roles";

export function Sidebar({
  items,
  roleName,
  name,
  brand,
  defaultCollapsed = false,
}: {
  items: NavItem[];
  roleName: string | null;
  name: string | null;
  brand: string;
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const activeHref = activeNavHref(items, pathname, useSearchParams());
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        // Cheap UI-only pref; read back by AppShell so the first paint after a
        // reload already has the right width (no flash).
        document.cookie = `mf_sidebar=${next ? "1" : "0"};path=/;max-age=31536000;samesite=lax`;
      } catch {
        /* cookies disabled — the toggle still works for this session */
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r bg-muted/30 transition-[width] duration-200 md:flex",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2 py-4",
          collapsed ? "justify-center px-2" : "justify-between pr-2 pl-4",
        )}
      >
        {collapsed ? null : (
          <div className="text-sm font-semibold tracking-wide">{brand}</div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Цэс дэлгэх" : "Цэс хумих"}
          title={collapsed ? "Цэс дэлгэх" : "Цэс хумих"}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* ponytail: collapsed = thin rail with just the toggle. An icon rail
          would need an icon per NavItem in roles.ts — add that if it's wanted. */}
      {collapsed ? null : (
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
          {items.map((i) => {
            const active = i.href === activeHref;
            return (
              <Link
                key={i.href}
                href={i.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
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
      )}

      {collapsed ? (
        <div className="mt-auto flex flex-col items-center gap-1 border-t p-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            aria-label="Гарах"
            title="Гарах"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-auto space-y-2 border-t p-2">
          {roleName || name ? (
            <div className="truncate px-1 text-xs text-muted-foreground">
              {roleName}
              {name ? (
                <span className="font-medium text-foreground">
                  {roleName ? " · " : ""}
                  {name}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex-1 justify-start gap-2 text-muted-foreground"
            >
              <LogOut className="size-4" />
              Гарах
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
