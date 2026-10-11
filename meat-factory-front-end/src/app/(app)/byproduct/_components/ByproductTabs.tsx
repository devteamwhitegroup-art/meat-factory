"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeNavHref, type NavItem } from "@/lib/auth/roles";

// Same matching as the main nav: /byproduct/new still lights "Задлалт".
export function ByproductTabs({ tabs }: { tabs: NavItem[] }) {
  const active = activeNavHref(tabs, usePathname(), new URLSearchParams());
  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={
            "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition-colors " +
            (active === t.href
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground")
          }
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
