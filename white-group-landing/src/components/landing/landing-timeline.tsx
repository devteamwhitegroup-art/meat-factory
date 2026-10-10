"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { Copy } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingTimeline({ t }: { t: Copy }) {
  const [active, setActive] = useState(4); // 2020 — the new factory
  const h = t.hist;
  const current = h.years[active];

  return (
    <section id="history" className="scroll-mt-20 py-26">
      <SectionHeading kicker={h.kicker} title={h.title} />
      <div className="mt-12 overflow-x-auto border-b border-line">
        <div className="flex min-w-max">
          {h.years.map((y, i) => (
            <button
              key={y.year}
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "-mb-px min-w-[92px] flex-1 cursor-pointer border-b-2 px-2.5 pt-3.5 pb-4 font-heading text-2xl tabular-nums hover:text-gold-700",
                i === active ? "border-gold text-gold-700" : "border-transparent text-ink/60",
              )}
            >
              {y.year}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-baseline gap-x-[clamp(24px,4vw,64px)] gap-y-4 pt-10">
        <span className="font-heading text-[clamp(64px,9vw,128px)] leading-[0.9] text-gold tabular-nums">
          {current.year}
        </span>
        <p aria-live="polite" className="max-w-[32ch] font-heading text-[clamp(24px,2.4vw,32px)] leading-[1.3]">
          {current.text}
        </p>
      </div>
    </section>
  );
}
