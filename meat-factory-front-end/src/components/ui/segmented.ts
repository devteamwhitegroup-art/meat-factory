import { cn } from "@/lib/utils";

// One look and height (h-9 bar, h-7 items) for every pill-tab row — NavTabs,
// FactoryFilter, list tabs — so they line up when they share a row. Scrolls
// sideways instead of wrapping on narrow screens.
export const SEGMENTED =
  "inline-flex h-9 w-fit max-w-full items-center overflow-x-auto rounded-lg bg-muted p-1 mr-4";

export function segmentCls(active: boolean): string {
  return cn(
    "inline-flex h-7 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-foreground/60 hover:text-foreground",
  );
}
