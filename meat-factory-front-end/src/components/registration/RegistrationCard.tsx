import Link from "next/link";
import { ChevronRight, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format/date";
import { StatusBadge } from "./StatusBadge";

type Line = { animalType: string; count: number };
type Props = {
  id: string;
  registrationCode?: string | null;
  status: string;
  herderName?: string | null;
  animalLines?: Line[] | null;
  vehicleNumber?: string | null;
  intakeDate?: string | null;
  // Cross-factory accounts see whose site it is.
  factoryLabel?: string | null;
};

// One registration as a big tappable tile: who (herder), what (animals),
// where it stands (status) and the truck that brought it.
export function RegistrationCard({
  id,
  registrationCode,
  status,
  herderName,
  animalLines,
  vehicleNumber,
  intakeDate,
  factoryLabel,
}: Props) {
  return (
    <Link
      href={`/registrations/${id}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition outline-none hover:border-primary/50 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-muted-foreground">
              {registrationCode ?? "—"}
            </span>
            {factoryLabel ? (
              <Badge variant="outline">{factoryLabel}</Badge>
            ) : null}
          </div>
          <div className="truncate text-lg font-semibold">
            {herderName ?? "—"}
          </div>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(animalLines ?? []).map((l) => (
          <span
            key={l.animalType}
            className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium"
          >
            {l.animalType}
            {l.count ? <b className="ml-1.5">{l.count}</b> : null}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <StatusBadge status={status} />
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {vehicleNumber ? (
            <>
              <Truck className="size-4" />
              {vehicleNumber} ·
            </>
          ) : null}{" "}
          {fmtDate(intakeDate)}
        </span>
      </div>
    </Link>
  );
}
