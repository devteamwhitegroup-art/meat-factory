import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Steps finished per status on a live-slaughter site (CANCELLED is the
// caller's business). Pre-butchered sites have no verification step.
const DONE: Record<string, number> = {
  REGISTERED: 1,
  WEIGHED: 2,
  VERIFIED: 3,
  PAYMENT_PENDING: 4,
  PARTIALLY_SETTLED: 4,
  SETTLED: 5,
};
const LIVE = ["Бүртгэл", "Жинлэлт", "Баталгаажуулалт", "Тооцоо", "Төлбөр"];
const PRE = ["Бүртгэл", "Жинлэлт", "Тооцоо", "Төлбөр"];

// The registration's road map: green ticks behind, the step to do now
// highlighted, the rest grey. A column on phones, a row from `sm` up.
export function RegistrationProgress({
  status,
  pre,
}: {
  status: string;
  pre: boolean;
}) {
  const steps = pre ? PRE : LIVE;
  let done = DONE[status] ?? 0;
  if (pre && done > 2) done -= 1;

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:gap-0">
      {steps.map((label, i) => {
        const state = i < done ? "done" : i === done ? "now" : "todo";
        return (
          <li
            key={label}
            aria-current={state === "now" ? "step" : undefined}
            className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center"
          >
            {i > 0 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-5 right-1/2 hidden h-1 w-full -translate-y-1/2 sm:block",
                  i < done
                    ? "bg-emerald-500"
                    : i === done
                      ? "bg-primary/30"
                      : "bg-border",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold",
                state === "done" &&
                  "border-emerald-500 bg-emerald-500 text-white",
                state === "now" &&
                  "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20",
                state === "todo" && "border-border bg-card text-muted-foreground",
              )}
            >
              {state === "done" ? <Check className="size-5" /> : i + 1}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-sm font-semibold",
                  state === "todo" && "font-medium text-muted-foreground",
                  state === "now" && "text-primary",
                )}
              >
                {label}
              </span>
              {state === "now" ? (
                <span className="block text-xs text-muted-foreground">
                  Одоо хийх алхам
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
