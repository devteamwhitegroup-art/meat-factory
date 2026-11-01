"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import { MarkSalesTransactionPaidDoc } from "@/lib/queries/sales";
import { runMutation } from "@/lib/runMutation";

export function MarkPaidButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [markPaid] = useMutation(MarkSalesTransactionPaidDoc);
  async function onClick() {
    setBusy(true);
    await runMutation(
      async () =>
        (await markPaid({ variables: { id } })).data?.markSalesTransactionPaid,
      {
        success: "Төлбөр тэмдэглэгдлээ",
        // BE logs the outstanding remainder as one installment — re-render
        // the server page so the installments card shows it.
        onSuccess: () => router.refresh(),
      },
    );
    setBusy(false);
  }
  return (
    <Button onClick={onClick} disabled={busy}>
      {busy ? "..." : "Төлбөр төлсөнд тэмдэглэх"}
    </Button>
  );
}
