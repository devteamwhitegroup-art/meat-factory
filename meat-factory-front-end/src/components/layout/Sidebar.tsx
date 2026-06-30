"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItemsFor, navIsActive, type StaffRole } from "@/lib/auth/roles";

export function Sidebar({ role }: { role: StaffRole | null }) {
  const pathname = usePathname();
  const items = navItemsFor(role);
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:block">
      <div className="px-4 py-4 text-sm font-semibold tracking-wide">
        Plant 01
        <div className="text-[11px] font-normal text-muted-foreground">
          Meat Processing
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-2">
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
    </aside>
  );
}
