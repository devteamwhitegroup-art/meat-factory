import { cookies } from "next/headers";
import { Shell } from "./Shell";
import { Topbar } from "./Topbar";
import { isKioskNav, navItemsFor } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { factoryKind, factoryName } from "@/lib/factory/factories";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [s, factories] = await Promise.all([getSession(), getFactories()]);
  // The account's own factory; cross-factory roles span all of them.
  const brand = s.factory ? factoryName(factories, s.factory) : "Бүх үйлдвэр";
  const items = navItemsFor(s.perms, factoryKind(factories, s.factory));

  // Single-purpose roles get a minimal kiosk shell: no sidebar, a slim top
  // bar with just their task links, and a centered content column with
  // larger targets. Everyone else gets the full sidebar.
  if (isKioskNav(items)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Topbar
          roleName={s.roleName}
          name={s.name}
          navItems={items}
          brand={brand}
        />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    );
  }

  const sidebarCollapsed = (await cookies()).get("mf_sidebar")?.value === "1";
  return (
    <Shell
      items={items}
      roleName={s.roleName}
      name={s.name}
      brand={brand}
      defaultCollapsed={sidebarCollapsed}
    >
      {children}
    </Shell>
  );
}
