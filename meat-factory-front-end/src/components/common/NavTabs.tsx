"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavTab = { href: string; label: string };

// Tab nav between sibling sub-pages. Visually matches the shadcn TabsList look
// but uses real <Link>s for full-page navigation (each route is its own server
// component, so we can't use Tabs state).
export function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname();

  return (
    <div className="inline-flex w-full max-w-md rounded-md bg-muted p-1 text-sm">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex-1 rounded-sm px-3 py-1.5 text-center font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
