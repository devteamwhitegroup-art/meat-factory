import type { ReactNode } from "react";
import { InboxIcon, TriangleAlertIcon } from "lucide-react";

// Placeholder where a list has nothing to show.
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-input bg-card/60 px-6 py-12 text-center text-base text-muted-foreground">
      <InboxIcon className="size-10 text-muted-foreground/60" />
      {children}
    </div>
  );
}

// Failed-query banner; renders nothing without a message.
export function ErrorNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-base text-destructive"
    >
      <TriangleAlertIcon className="mt-0.5 size-5 shrink-0" />
      {message}
    </div>
  );
}
