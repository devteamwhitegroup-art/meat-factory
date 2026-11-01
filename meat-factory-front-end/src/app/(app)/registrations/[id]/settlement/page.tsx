import { SettlementClient } from "./settlement-client";
import { requireCap } from "@/lib/auth/server";

type Props = { params: Promise<{ id: string }> };

export default async function SettlementPage({ params }: Props) {
  // Read-only access for SCALE so the weigher can verify their per-entry name
  // on the final receipt. Mutation buttons inside the client still check
  // `settle` separately.
  const session = await requireCap("SETTLEMENT_CREATE", "SETTLEMENT_PAY");
  const { id } = await params;
  return (
    <SettlementClient
      id={id}
      canPay={session.can("SETTLEMENT_PAY")}
      canSales={session.can("SALES_MANAGE")}
    />
  );
}
