"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
import { activeNavHref, type NavItem } from "@/lib/auth/roles";

// Same matching as the main nav: /byproduct/new still lights "Задлалт".
export function ByproductTabs({ tabs }: { tabs: NavItem[] }) {
  const active = activeNavHref(tabs, usePathname(), new URLSearchParams());
  return (
    <nav className={SEGMENTED}>
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={segmentCls(active === t.href)}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
