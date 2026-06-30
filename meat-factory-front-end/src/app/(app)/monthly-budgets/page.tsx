import { MonthlyBudgetsClient } from "./monthly-budgets-client";
import { requireCap } from "@/lib/auth/server";

export default async function MonthlyBudgetsPage() {
  await requireCap("monthlyBudgets");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Сарын төсөв</h1>
        <p className="text-sm text-muted-foreground">
          Сар бүрийн орлогын зорилт. Тайлан хуудасны төсөв vs малчдын зардал vs
          орлого графикт энэ утга харагдана.
        </p>
      </div>
      <MonthlyBudgetsClient />
    </div>
  );
}
