// Codegen emits list types as `[Type]` where elements can be null.
// Use compact() to filter nulls and narrow the type for callers.
export function compact<T>(
  arr: ReadonlyArray<T | null | undefined> | null | undefined,
): T[] {
  return (arr ?? []).filter((x): x is T => x != null);
}
