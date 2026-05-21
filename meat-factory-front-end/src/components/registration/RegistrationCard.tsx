import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { ANIMAL_MN } from '@/lib/format/enum';

type Line = { animalType: string; count: number };
type Props = {
  id: string;
  registrationNumber: number;
  status: string;
  herderName?: string | null;
  animalLines?: Line[] | null;
};

export function RegistrationCard({
  id,
  registrationNumber,
  status,
  herderName,
  animalLines,
}: Props) {
  return (
    <Link href={`/registrations/${id}`} className="block">
      <Card className="transition-colors hover:bg-muted/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">
            Дугаар: {registrationNumber}
          </CardTitle>
          <StatusBadge status={status} />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {herderName ? (
            <div className="text-muted-foreground">{herderName}</div>
          ) : null}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {(animalLines ?? []).map((l) => (
              <span key={l.animalType}>
                {ANIMAL_MN[l.animalType] ?? l.animalType}: <b>{l.count}</b>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
