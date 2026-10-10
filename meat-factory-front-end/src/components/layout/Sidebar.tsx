"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_MN } from "@/lib/format/enum";
import { cn } from "@/lib/utils";
import { useLogout } from "@/lib/auth/useLogout";
import { navItemsFor, navIsActive, type StaffRole } from "@/lib/auth/roles";

export function Sidebar({
  role,
  factory,
  defaultCollapsed = false,
}: {
  role: StaffRole | null;
  factory: string | null;
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const items = navItemsFor(role, factory);
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
          <div className="text-sm font-semibold tracking-wide">
            Plant 01
            <div className="text-[11px] font-normal text-muted-foreground">
              Meat Processing
            </div>
          </div>
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
            const active = navIsActive(pathname, i.href);
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
          {role ? (
            <div className="px-1 text-xs text-muted-foreground">
              {ROLE_MN[role] ?? role}
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
