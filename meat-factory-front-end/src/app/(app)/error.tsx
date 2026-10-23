"use client";

// Error boundary for the authed app group. Catches thrown render/data errors
// (e.g. the GraphQL proxy returning 502 when the back-end is unreachable) and
// shows a recoverable fallback instead of a blank crash.
// Next 16: the recover prop is `unstable_retry` (was `reset` in earlier versions).
import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <TriangleAlert className="size-12 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Алдаа гарлаа</h2>
        <p className="max-w-md text-base text-muted-foreground">
          {error.message || "Системд гэнэтийн алдаа гарлаа. Дахин оролдоно уу."}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="lg" onClick={() => unstable_retry()}>
          Дахин оролдох
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Нүүр хуудас руу
        </Link>
      </div>
    </div>
  );
}
