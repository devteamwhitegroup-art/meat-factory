"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";

import { Button } from "@/components/ui/button";
import {
  CancelFactoryTransferDoc,
  ReceiveFactoryTransferDoc,
} from "@/lib/queries/factory-transfer";
import { runMutation } from "@/lib/runMutation";

// In-transit row actions: the receiving factory confirms arrival (stock in),
// the sending factory may cancel (stock back).
export function TransferActions({
  id,
  canReceive,
  canCancel,
}: {
  id: string;
  canReceive: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [receive] = useMutation(ReceiveFactoryTransferDoc);
  const [cancel] = useMutation(CancelFactoryTransferDoc);
  const [busy, setBusy] = useState(false);

  async function run(
    question: string,
    action: () => Promise<
      { success?: boolean | null; message?: string | null } | null | undefined
    >,
  ) {
    if (!confirm(question)) return;
    setBusy(true);
    await runMutation(action, {
      success: (d) => d.message ?? "Хадгалагдлаа",
      onSuccess: () => router.refresh(),
    });
    setBusy(false);
  }

  return (
    <div className="flex justify-end gap-2">
      {canReceive ? (
        <Button
          size="sm"
          disabled={busy}
          onClick={() =>
            run(
              "Бүх барааг хүлээн авсан уу? Таны нөөцөд нэмэгдэнэ.",
              async () =>
                (await receive({ variables: { id } })).data
                  ?.receiveFactoryTransfer,
            )
          }
        >
          Хүлээн авах
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(
              "Илгээлтийг цуцлах уу? Бараа илгээгчийн нөөцөд буцна.",
              async () =>
                (await cancel({ variables: { id } })).data
                  ?.cancelFactoryTransfer,
            )
          }
        >
          Цуцлах
        </Button>
      ) : null}
    </div>
  );
}
