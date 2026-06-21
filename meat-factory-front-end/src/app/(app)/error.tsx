'use client';

// Error boundary for the authed app group. Catches thrown render/data errors
// (e.g. the GraphQL proxy returning 502 when the back-end is unreachable) and
// shows a recoverable fallback instead of a blank crash.
// Next 16: the recover prop is `unstable_retry` (was `reset` in earlier versions).
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Алдаа гарлаа</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || 'Системд гэнэтийн алдаа гарлаа. Дахин оролдоно уу.'}
        </p>
      </div>
      <Button onClick={() => unstable_retry()}>Дахин оролдох</Button>
    </div>
  );
}
