import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { isOperatorRole, navItemsFor, type StaffRole } from "@/lib/auth/roles";
import { FACTORY_COOKIE } from "@/lib/auth/server";
import { FACTORY_MN } from "@/lib/format/enum";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const role = (jar.get(env.ROLE_COOKIE_NAME)?.value ??
    null) as StaffRole | null;
  const factory = jar.get(FACTORY_COOKIE)?.value ?? null;

  // Operator roles (gate / scale / store) get a minimal single-purpose shell:
  // no sidebar, a slim top bar with just their task links, and a centered
  // content column with larger targets. Office roles get the full sidebar.
  if (isOperatorRole(role)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Topbar
          role={role}
          navItems={navItemsFor(role, factory)}
          brand={FACTORY_MN[factory ?? ""] ?? "Plant 01"}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    );
  }

  const sidebarCollapsed = jar.get("mf_sidebar")?.value === "1";

  // Fixed-height shell: the row is exactly the viewport, the page itself never
  // scrolls, and <main> is the only scroll container — so the sidebar keeps
  // full height regardless of how tall the page content is.
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        role={role}
        factory={factory}
        defaultCollapsed={sidebarCollapsed}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
