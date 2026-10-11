import { AppShell } from "@/components/layout/AppShell";
import { FactoriesProvider } from "@/lib/factory/FactoriesProvider";
import { getFactories } from "@/lib/factory/server";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Factory catalogue once per request; client components read it through
  // useFactories() for names and kind rules.
  const factories = await getFactories();
  return (
    <FactoriesProvider factories={factories}>
      <AppShell>{children}</AppShell>
    </FactoriesProvider>
  );
}
