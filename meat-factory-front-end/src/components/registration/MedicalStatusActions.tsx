"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { CheckIcon, Undo2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SetMedicalNumberStatusDoc } from "@/lib/queries/medical-number";
import { MEDICAL_NUMBER_STATUS_MN } from "@/lib/format/enum";
import type { Medical_Number_Status } from "@/lib/gql/graphql";
import { runMutation } from "@/lib/runMutation";

// Vet's ruling on one number after checking it in the government service.
// Refreshes the server page it sits on.
export function MedicalStatusActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [save, { loading }] = useMutation(SetMedicalNumberStatusDoc);

  async function set(next: Medical_Number_Status) {
    await runMutation(
      async () =>
        (await save({ variables: { id, status: next } })).data
          ?.setMedicalNumberStatus,
      {
        success: MEDICAL_NUMBER_STATUS_MN[next],
        onSuccess: () => router.refresh(),
      },
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {status !== "APPROVED" ? (
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-emerald-700"
          disabled={loading}
          onClick={() => set("APPROVED")}
        >
          <CheckIcon className="size-3.5" />
          Баталгаажуулах
        </Button>
      ) : null}
      {status !== "REJECTED" ? (
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-destructive"
          disabled={loading}
          onClick={() => set("REJECTED")}
        >
          <XIcon className="size-3.5" />
          Татгалзах
        </Button>
      ) : null}
      {status !== "PENDING" ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label="Баталгаажилт хийгдээгүй болгох"
          title="Баталгаажилт хийгдээгүй болгох"
          disabled={loading}
          onClick={() => set("PENDING")}
        >
          <Undo2Icon className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
