import type { ReactNode } from "react";

// Dashed placeholder where a list has nothing to show.
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
      {children}
    </div>
  );
}

// Failed-query banner; renders nothing without a message.
export function ErrorNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
      {message}
    </div>
  );
}
