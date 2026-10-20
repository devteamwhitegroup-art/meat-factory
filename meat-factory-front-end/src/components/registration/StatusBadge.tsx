import { Badge } from "@/components/ui/badge";
import { REGISTRATION_STATUS_MN } from "@/lib/format/enum";
import { cn } from "@/lib/utils";

const COLOR: Record<string, string> = {
  REGISTERED: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
  WEIGHED: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
  VERIFIED: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-400",
  PAYMENT_PENDING: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  PARTIALLY_SETTLED: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  SETTLED: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status ?? "";
  return (
    <Badge className={cn("border-0", COLOR[s] ?? "bg-muted")}>
      {REGISTRATION_STATUS_MN[s] ?? s}
    </Badge>
  );
}
