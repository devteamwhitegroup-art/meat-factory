import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_COLOR, PAYMENT_STATUS_MN } from "@/lib/format/enum";
import { cn } from "@/lib/utils";

// PAID / PARTIALLY_PAID / PENDING (sales invoices + herder settlements).
export function PaymentBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const s = status ?? "PENDING";
  return (
    <Badge
      className={cn(PAYMENT_STATUS_COLOR[s] ?? "border-0 bg-muted", className)}
    >
      {PAYMENT_STATUS_MN[s] ?? s}
    </Badge>
  );
}
