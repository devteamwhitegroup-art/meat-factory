import { toast } from "sonner";
import { unwrap } from "@/lib/unwrap";

// Standard CRUD-mutation flow shared across the client components: run the
// mutation, unwrap its `{ success, message }` envelope, toast on success/error,
// then run an optional follow-up (e.g. refetch / close dialog).
//
// `action` returns the specific response envelope, e.g.
//   () => (await createCustomer({ variables })).data?.createCustomer
// `success` may be a static string or a function of the unwrapped envelope
// (for messages that include returned values, e.g. the new settlement total).
// Returns true on success, false on failure (so callers can branch if needed).
export async function runMutation<
  T extends { success?: boolean | null; message?: string | null },
>(
  action: () => Promise<T | null | undefined>,
  opts: {
    success?: string | ((data: T) => string);
    onSuccess?: () => unknown;
  } = {},
): Promise<boolean> {
  try {
    const data = unwrap(await action());
    if (opts.success) {
      toast.success(
        typeof opts.success === "function" ? opts.success(data) : opts.success,
      );
    }
    await opts.onSuccess?.();
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
    return false;
  }
}
