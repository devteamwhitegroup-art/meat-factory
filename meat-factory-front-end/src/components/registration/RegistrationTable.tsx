import Link from "next/link";
import type { ComponentProps } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDate } from "@/lib/format/date";
import { RegistrationCard } from "./RegistrationCard";
import { StatusBadge } from "./StatusBadge";

type Row = ComponentProps<typeof RegistrationCard>;

// Dense alternative to the card grid (same row shape). The code link is
// stretched over the whole row, so any click on it opens the registration.
export function RegistrationTable({ rows }: { rows: Row[] }) {
  const showFactory = rows.some((r) => r.factoryLabel);
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Код</TableHead>
            <TableHead>Малчин</TableHead>
            <TableHead>Мал</TableHead>
            {showFactory ? <TableHead>Үйлдвэр</TableHead> : null}
            <TableHead>Машин</TableHead>
            <TableHead>Огноо</TableHead>
            <TableHead>Төлөв</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="relative">
              <TableCell>
                <Link
                  href={`/registrations/${r.id}`}
                  className="font-mono font-semibold outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/40"
                >
                  {r.registrationCode ?? "—"}
                </Link>
              </TableCell>
              <TableCell className="font-medium">
                {r.herderName ?? "—"}
              </TableCell>
              <TableCell>
                {(r.animalLines ?? [])
                  .map((l) =>
                    l.count ? `${l.animalType} ${l.count}` : l.animalType,
                  )
                  .join(", ") || "—"}
              </TableCell>
              {showFactory ? <TableCell>{r.factoryLabel}</TableCell> : null}
              <TableCell>{r.vehicleNumber ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {fmtDate(r.intakeDate)}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
