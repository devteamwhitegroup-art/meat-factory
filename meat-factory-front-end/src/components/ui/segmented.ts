import { cn } from "@/lib/utils";

// One look and height (h-11 bar) for every pill-tab row — NavTabs,
// FactoryFilter, list tabs — so they line up when they share a row. Scrolls
// sideways instead of wrapping on narrow screens. Items are h-full, not a
// fixed height: anything taller than the bar's inside (minus border and
// padding) overflows, and overflow-x-auto then shows a vertical scrollbar.
export const SEGMENTED =
  "inline-flex h-11 w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border bg-card p-1 shadow-xs mr-4";

export function segmentCls(active: boolean): string {
  return cn(
    "inline-flex h-full shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-all",
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-foreground/70 hover:bg-muted hover:text-foreground",
  );
}

// Status filter chips (a wrapping row of links): big enough to hit with a
// thumb, the selected one filled. Shared by every `?status=` list.
export function chipCls(active: boolean): string {
  return cn(
    "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground shadow-sm"
      : "border-input bg-card text-foreground/80 hover:bg-muted hover:text-foreground",
  );
}
