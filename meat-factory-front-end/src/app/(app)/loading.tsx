import { Loader2 } from "lucide-react";

// Instant feedback on every menu click: without it a slow page looks like
// the click did nothing, and people click again.
export default function Loading() {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <Loader2 className="size-10 animate-spin text-primary" />
      <span className="text-base">Ачаалж байна…</span>
    </div>
  );
}
