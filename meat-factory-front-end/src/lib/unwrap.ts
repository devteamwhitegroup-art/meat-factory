import { compact } from '@/lib/compact';

// Every back-end response is { success, message, <entity>|null }. This
// helper centralises "throw on success === false so callers can toast".
export function unwrap<
  T extends { success?: boolean | null; message?: string | null },
>(r: T | null | undefined): T {
  if (!r) throw new Error('Сервер хариу буцаасангүй');
  if (r.success === false) throw new Error(r.message ?? 'Алдаа гарлаа');
  return r;
}

// Server-page helper for list queries. Unwraps a `{ success, message, count }`
// envelope plus its items array into `{ rows, count, error }`. On a failed
// response it returns the message in `error` (instead of throwing) so the page
// can render an inline error block rather than a misleading empty state.
export function unwrapList<T>(
  envelope:
    | {
        success?: boolean | null;
        message?: string | null;
        count?: number | null;
      }
    | null
    | undefined,
  items: ReadonlyArray<T | null | undefined> | null | undefined,
): { rows: T[]; count: number; error: string | null } {
  try {
    const e = unwrap(envelope);
    return { rows: compact(items), count: e.count ?? 0, error: null };
  } catch (err) {
    return {
      rows: [],
      count: 0,
      error: err instanceof Error ? err.message : 'Алдаа гарлаа',
    };
  }
}
