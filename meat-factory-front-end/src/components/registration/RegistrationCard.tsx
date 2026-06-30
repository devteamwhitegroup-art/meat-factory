import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";

type Line = { animalType: string; count: number };
type Props = {
  id: string;
  registrationCode?: string | null;
  status: string;
  herderName?: string | null;
  animalLines?: Line[] | null;
  // animalType → display name from the Animals catalogue (passed by the page).
  animalNames: Record<string, string>;
};

export function RegistrationCard({
  id,
  registrationCode,
  status,
  herderName,
  animalLines,
  animalNames,
}: Props) {
  return (
    <Link href={`/registrations/${id}`} className="block h-full">
      <Card className="flex h-full flex-col transition-colors hover:bg-muted/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">
            <p className="font-mono">{registrationCode ?? "—"}</p>
            <StatusBadge status={status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-2 text-sm">
          {/* Always reserve the name row so cards line up vertically. */}
          <div className="text-muted-foreground">{herderName ?? "—"}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {(animalLines ?? []).map((l) => (
              <span key={l.animalType}>
                {animalNames[l.animalType] ?? l.animalType}: <b>{l.count}</b>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
