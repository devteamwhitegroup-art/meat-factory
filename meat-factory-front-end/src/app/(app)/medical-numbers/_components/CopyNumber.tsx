"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

// The vet pastes the number into the government checking service.
export function CopyNumber({ number }: { number: string }) {
  return (
    <button
      type="button"
      title="Хуулах"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(number);
          toast.success(`${number} хуулсан`);
        } catch {
          toast.error("Хуулж чадсангүй");
        }
      }}
      className="inline-flex items-center gap-2 font-mono text-base tabular-nums hover:text-primary"
    >
      {number}
      <CopyIcon className="size-3.5 text-muted-foreground" />
    </button>
  );
}
