import { requireCap } from "@/lib/auth/server";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersClient } from "./orders-client";
import { PackagesTab } from "./_components/PackagesTab";

export default async function OrdersPage() {
  await requireCap("ORDER_MANAGE");
  return (
    <div className="space-y-4">
      <PageHeader
        title="Онлайн захиалга"
        description="Вэб сайтаас QPay-ээр төлж ирсэн захиалга, сайтад харагдах багцууд."
      />
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Захиалга</TabsTrigger>
          <TabsTrigger value="packages">Багц</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="pt-4">
          <OrdersClient />
        </TabsContent>
        <TabsContent value="packages" className="pt-4">
          <PackagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
