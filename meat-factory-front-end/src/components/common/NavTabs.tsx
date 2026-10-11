"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";

export type NavTab = { href: string; label: string };

// Tab nav between sibling sub-pages. Visually matches the shadcn TabsList look
// but uses real <Link>s for full-page navigation (each route is its own server
// component, so we can't use Tabs state).
export function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname();

  return (
    <div className={SEGMENTED}>
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className={segmentCls(active)}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
