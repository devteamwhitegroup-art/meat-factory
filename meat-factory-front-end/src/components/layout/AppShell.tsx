import { Shell } from "./Shell";
import { navItemsFor } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { factoryKind, factoryName } from "@/lib/factory/factories";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [s, factories] = await Promise.all([getSession(), getFactories()]);
  // The account's own factory; cross-factory roles span all of them.
  const brand = s.factory ? factoryName(factories, s.factory) : "Бүх үйлдвэр";
  return (
    <Shell
      items={navItemsFor(s.perms, factoryKind(factories, s.factory))}
      roleName={s.roleName}
      name={s.name}
      brand={brand}
    >
      {children}
    </Shell>
  );
}
