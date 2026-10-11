"use client";

import { useCallback, useEffect, useRef } from "react";

// Form drafts that survive leaving the page (and reloads) in this browser
// tab: `value` is saved to sessionStorage once it differs from what the form
// started with, handed back to `restore` once on mount, and dropped by the
// returned `clear()` after a successful submit. Restoring after mount (not in
// useState initialisers) keeps server and client HTML identical on a full
// page load.
// ponytail: sessionStorage — closing the tab drops drafts; switch to
// localStorage if they must outlive the tab.
export function useDraft<T>(
  key: string,
  value: T,
  restore: (saved: T) => void,
): () => void {
  const storageKey = `draft:${key}`;
  const json = JSON.stringify(value);
  const initial = useRef(json); // untouched form = nothing to keep
  const ready = useRef(false); // restore effect has run
  const restoring = useRef(false); // restored values not rendered yet
  const cleared = useRef<string | null>(null); // value at clear()
  const latest = useRef(json);

  // Declared before the restore effect so it runs first (and skips) on mount.
  useEffect(() => {
    latest.current = json;
    if (!ready.current || json === cleared.current) return;
    try {
      if (json === initial.current) {
        // Back to the starting values — unless a restore is still landing.
        if (!restoring.current) sessionStorage.removeItem(storageKey);
        return;
      }
      restoring.current = false;
      sessionStorage.setItem(storageKey, json);
    } catch {
      // storage full / disabled — drafts are a convenience only
    }
  }, [storageKey, json]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        restoring.current = true;
        restore(JSON.parse(saved) as T);
      }
    } catch {
      // unreadable draft — start fresh
    }
    ready.current = true;
    // Restore once per key; `restore` only calls stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return useCallback(() => {
    cleared.current = latest.current;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);
}
