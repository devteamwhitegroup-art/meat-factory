import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "green" | "amber" | "rose" | "default";
};

const ACCENT: Record<NonNullable<Props["accent"]>, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  default: "text-foreground",
};

// Stat tile: muted label with an optional icon on the right, big bold value.
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
}: Props) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn("text-3xl font-bold tracking-tight", ACCENT[accent])}
        >
          {value}
        </div>
        {hint ? (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
