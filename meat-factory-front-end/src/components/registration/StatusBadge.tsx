import {
  Ban,
  Clock,
  CircleCheckBig,
  ClipboardList,
  HandCoins,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { REGISTRATION_STATUS_MN } from "@/lib/format/enum";
import { cn } from "@/lib/utils";

// Colour AND icon per status, so the stage reads even without colour vision.
export const STATUS_STYLE: Record<string, { cls: string; icon: LucideIcon }> =
  {
    REGISTERED: {
      cls: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
      icon: ClipboardList,
    },
    WEIGHED: {
      cls: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
      icon: Scale,
    },
    VERIFIED: {
      cls: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-400",
      icon: ShieldCheck,
    },
    PAYMENT_PENDING: {
      cls: "bg-amber-500/15 text-amber-800 dark:text-amber-400",
      icon: Clock,
    },
    PARTIALLY_SETTLED: {
      cls: "bg-orange-500/15 text-orange-800 dark:text-orange-400",
      icon: HandCoins,
    },
    SETTLED: {
      cls: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400",
      icon: CircleCheckBig,
    },
    CANCELLED: {
      cls: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
      icon: Ban,
    },
  };

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status ?? "";
  const style = STATUS_STYLE[s];
  const Icon = style?.icon;
  return (
    <Badge className={cn("border-0", style?.cls ?? "bg-muted")}>
      {Icon ? <Icon /> : null}
      {REGISTRATION_STATUS_MN[s] ?? s}
    </Badge>
  );
}
