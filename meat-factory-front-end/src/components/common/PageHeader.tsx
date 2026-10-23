import type { ReactNode } from "react";
import { BackButton } from "./BackButton";

// Every page opens the same way, so people always know where to look:
// (Буцах) · title · one plain sentence on what the page is for · the page's
// main buttons on the right.
export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  // Parent page; shows the «Буцах» button.
  back?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 space-y-3">
        {back ? <BackButton href={back} /> : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description ? (
            <div className="max-w-3xl text-base text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
