"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { CheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReviewRegistrationChangeDoc } from "@/lib/queries/registration";
import { runMutation } from "@/lib/runMutation";

// Admin's ruling on one change request. Approve applies the proposed values.
export function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [review, { loading }] = useMutation(ReviewRegistrationChangeDoc);

  async function decide(approve: boolean) {
    await runMutation(
      async () =>
        (
          await review({
            variables: { id, approve, note: note.trim() || null },
          })
        ).data?.reviewRegistrationChange,
      {
        success: approve ? "Зөвшөөрч, бүртгэл засагдлаа" : "Татгалзлаа",
        onSuccess: () => router.refresh(),
      },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Тайлбар (заавал биш)"
        className="min-w-0 flex-1"
      />
      <Button
        variant="outline"
        className="gap-1 text-emerald-700"
        disabled={loading}
        onClick={() => decide(true)}
      >
        <CheckIcon className="size-4" />
        Зөвшөөрөх
      </Button>
      <Button
        variant="outline"
        className="gap-1 text-destructive"
        disabled={loading}
        onClick={() => decide(false)}
      >
        <XIcon className="size-4" />
        Татгалзах
      </Button>
    </div>
  );
}
