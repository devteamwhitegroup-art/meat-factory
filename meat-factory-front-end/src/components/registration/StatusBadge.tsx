import { Badge } from "@/components/ui/badge";
import { REGISTRATION_STATUS_MN } from "@/lib/format/enum";
import { cn } from "@/lib/utils";

const COLOR: Record<string, string> = {
  REGISTERED: "bg-slate-200 text-slate-800",
  WEIGHED: "bg-blue-100 text-blue-800",
  VERIFIED: "bg-indigo-100 text-indigo-800",
  PAYMENT_PENDING: "bg-amber-100 text-amber-800",
  PARTIALLY_SETTLED: "bg-amber-100 text-amber-800",
  SETTLED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status ?? "";
  return (
    <Badge className={cn("border-0", COLOR[s] ?? "bg-muted")}>
      {REGISTRATION_STATUS_MN[s] ?? s}
    </Badge>
  );
}
