"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

const FOOTER =
  "flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground";

// "Нийт N / ‹ Өмнөх · Хуудас P · Дараах ›" footer for client-side paginated lists. There's no
// server page count — "next" stays enabled while a full page came back.
type Props = {
  page: number;
  onPageChange: (page: number) => void;
  total: number;
  pageSize: number;
  // Rows on the current page.
  count: number;
};

export function PaginationFooter({
  page,
  onPageChange,
  total,
  pageSize,
  count,
}: Props) {
  return (
    <div className={FOOTER}>
      <span>
        Нийт: <b className="text-foreground">{total}</b>
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft />
          Өмнөх
        </Button>
        <span className="px-1">Хуудас {page}</span>
        <Button
          variant="outline"
          disabled={count < pageSize}
          onClick={() => onPageChange(page + 1)}
        >
          Дараах
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

// Same footer for server pages driven by `?page=`; a null href hides that
// arrow.
export function LinkPaginationFooter({
  page,
  total,
  prevHref,
  nextHref,
}: {
  page: number;
  total: number;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const cls = buttonVariants({ variant: "outline" });
  return (
    <div className={FOOTER}>
      <span>
        Нийт: <b className="text-foreground">{total}</b>
      </span>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link href={prevHref} className={cls}>
            <ChevronLeft />
            Өмнөх
          </Link>
        ) : null}
        <span className="px-1">Хуудас {page}</span>
        {nextHref ? (
          <Link href={nextHref} className={cls}>
            Дараах
            <ChevronRight />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
