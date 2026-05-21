// Every back-end response is { success, message, <entity>|null }. This
// helper centralises "throw on success === false so callers can toast".
export function unwrap<
  T extends { success?: boolean | null; message?: string | null },
>(r: T | null | undefined): T {
  if (!r) throw new Error('Сервер хариу буцаасангүй');
  if (r.success === false) throw new Error(r.message ?? 'Алдаа гарлаа');
  return r;
}
