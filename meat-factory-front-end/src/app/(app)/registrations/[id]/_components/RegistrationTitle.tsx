"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "@/components/common/BackButton";
import { StatusBadge } from "@/components/registration/StatusBadge";

// Step page → its name, so the heading says what you are doing here.
const STEP: Record<string, string> = {
  weigh: "Жинлэлт",
  verify: "Баталгаажуулалт",
  byproduct: "Гэдэс тоолох",
  settlement: "Тооцоо, төлбөр",
};

// Back to the registration + the step name, code and status; heads every
// step page (weigh / verify / byproduct / settlement).
export function RegistrationTitle({
  id,
  code,
  status,
}: {
  id: string;
  code: string | null | undefined;
  status: string | null | undefined;
}) {
  const step = STEP[usePathname().split("/").pop() ?? ""];
  return (
    <div className="space-y-3">
      <BackButton href={`/registrations/${id}`} label="Бүртгэл рүү буцах" />
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {step ?? "Бүртгэл"}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-base font-semibold">
            {code ?? "—"}
          </span>
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}
