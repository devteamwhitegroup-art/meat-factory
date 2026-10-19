"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

// "Нийт N / ← Хуудас P →" footer for client-side paginated lists. There's no
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
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>Нийт: {total}</span>
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          ←
        </Button>
        <span>Хуудас {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={count < pageSize}
          onClick={() => onPageChange(page + 1)}
        >
          →
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
  const cls = buttonVariants({ variant: "outline", size: "sm" });
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>Нийт: {total}</span>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link href={prevHref} className={cls}>
            ←
          </Link>
        ) : null}
        <span>Хуудас {page}</span>
        {nextHref ? (
          <Link href={nextHref} className={cls}>
            →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
