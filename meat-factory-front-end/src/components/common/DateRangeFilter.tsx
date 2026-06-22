'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SHORTCUTS, thisMonth, ymd } from '@/lib/date/range';

function parseLocal(s: string): Date | undefined {
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

// Date-range filter: preset shortcuts (today / yesterday / this & last month)
// plus a calendar for arbitrary ranges. Writes `from`/`to` to the URL so the
// (server) page refetches. Defaults to the current month when nothing is set.
export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const def = thisMonth();
  const from = sp.get('from') ?? def.from;
  const to = sp.get('to') ?? def.to;

  function apply(f: string, t: string) {
    const params = new URLSearchParams(sp.toString());
    params.set('from', f);
    params.set('to', t);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function onCalendar(range: DateRange | undefined) {
    // Commit once both ends are chosen (first click sets `from` only).
    if (range?.from && range?.to) apply(ymd(range.from), ymd(range.to));
  }

  const fromD = parseLocal(from);
  const toD = parseLocal(to);
  const selected: DateRange | undefined = fromD
    ? { from: fromD, to: toD }
    : undefined;
  const label = from === to ? from : `${from} – ${to}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-9 gap-2 font-normal',
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        <span className="tabular-nums">{label}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <div className="mb-2 grid grid-cols-2 gap-1.5">
          {SHORTCUTS.map((s) => {
            const r = s.range();
            const active = from === r.from && to === r.to;
            return (
              <Button
                key={s.key}
                size="sm"
                variant={active ? 'default' : 'outline'}
                className="w-full font-normal"
                onClick={() => apply(r.from, r.to)}
              >
                {s.label}
              </Button>
            );
          })}
        </div>
        <Calendar
          mode="range"
          numberOfMonths={1}
          selected={selected}
          onSelect={onCalendar}
          defaultMonth={fromD}
          className="p-0"
        />
      </PopoverContent>
    </Popover>
  );
}
