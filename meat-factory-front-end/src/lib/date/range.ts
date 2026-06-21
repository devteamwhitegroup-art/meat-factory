// Date-range filter model. The URL carries `from` + `to` as `YYYY-MM-DD` local
// dates. When absent the filter DEFAULTS to the current month (see `thisMonth`).
// Shortcuts compute a from/to; the calendar picks arbitrary ranges.
// `parseRange` (server side) turns from/to into an inclusive ISO pair.

// Local YYYY-MM-DD (avoids UTC shifting the calendar day).
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Whole calendar month [year, m0] (m0 0-based; over/underflow normalises).
function monthRange(year: number, m0: number): { from: string; to: string } {
  return {
    from: ymd(new Date(year, m0, 1)),
    to: ymd(new Date(year, m0 + 1, 0)),
  };
}

// Default filter range = the current calendar month.
export function thisMonth(): { from: string; to: string } {
  const n = new Date();
  return monthRange(n.getFullYear(), n.getMonth());
}

export type Shortcut = {
  key: string;
  label: string;
  range: () => { from: string; to: string };
};

export const SHORTCUTS: Shortcut[] = [
  {
    key: 'today',
    label: 'Өнөөдөр',
    range: () => {
      const n = new Date();
      return { from: ymd(n), to: ymd(n) };
    },
  },
  {
    key: 'yesterday',
    label: 'Өчигдөр',
    range: () => {
      const n = new Date();
      n.setDate(n.getDate() - 1);
      return { from: ymd(n), to: ymd(n) };
    },
  },
  {
    key: 'this_month',
    label: 'Энэ сар',
    range: () => thisMonth(),
  },
  {
    key: 'prev_month',
    label: 'Өнгөрсөн сар',
    range: () => {
      const n = new Date();
      return monthRange(n.getFullYear(), n.getMonth() - 1);
    },
  },
];

export type ResolvedRange = { startDate: string; endDate: string };

// Server side: `from`/`to` (YYYY-MM-DD) → inclusive ISO range, or null when
// neither is set. A single bound is treated as a one-day range.
export function parseRange(
  from?: string | null,
  to?: string | null,
): ResolvedRange | null {
  if (!from && !to) return null;
  const f = (from || to)!;
  const t = (to || from)!;
  const [fy, fm, fd] = f.split('-').map(Number);
  const [ty, tm, td] = t.split('-').map(Number);
  if (!fy || !fm || !fd || !ty || !tm || !td) return null;
  return {
    startDate: new Date(fy, fm - 1, fd, 0, 0, 0, 0).toISOString(),
    endDate: new Date(ty, tm - 1, td, 23, 59, 59, 999).toISOString(),
  };
}
