import { BackButton } from "@/components/common/BackButton";
import { StatusBadge } from "@/components/registration/StatusBadge";

// Back to the registration + its code and status; heads every step page
// (weigh / verify / byproduct / settlement).
export function RegistrationTitle({
  id,
  code,
  status,
}: {
  id: string;
  code: string | null | undefined;
  status: string | null | undefined;
}) {
  return (
    <div className="flex items-center gap-6">
      <BackButton href={`/registrations/${id}`} />
      <div>
        <div className="text-sm text-muted-foreground">Бүртгэлийн код</div>
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold">{code ?? "—"}</h1>
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}
