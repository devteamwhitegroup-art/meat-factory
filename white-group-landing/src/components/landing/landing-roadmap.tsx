"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";
import type { Copy } from "./data";
import { centerInRail, SectionHeading } from "./section-heading";

export function LandingRoadmap({ t }: { t: Copy }) {
  const r = t.roadmap;
  const lastDone = r.items.findLastIndex((i) => !i.planned);
  const firstPlanned = r.items.findIndex((i) => i.planned);
  const [active, setActive] = useState(Math.max(lastDone, 0));
  const rail = useRef<HTMLDivElement>(null);
  const cur = r.items[active];

  useEffect(() => {
    centerInRail(rail.current, rail.current?.querySelector<HTMLElement>('[aria-selected="true"]'));
  }, [active]);

  return (
    <section id="roadmap" className="scroll-mt-20 py-18 sm:py-26">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-x-[clamp(32px,6vw,96px)] gap-y-6">
        <SectionHeading title={r.title} />
        <p className="text-ink/80">{r.sub}</p>
      </div>

      <Tabs.Root value={String(active)} onValueChange={(v) => setActive(Number(v))}>
        <div ref={rail} className="relative mt-12 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Tabs.List activateOnFocus data-motion="roadmap-rule" className="flex min-w-max items-stretch">
            {r.items.map((it, i) => (
              <div key={i} className="flex">
                {i === firstPlanned && lastDone >= 0 && (
                  <span
                    aria-hidden
                    className="flex flex-col justify-end border-l border-gold px-3 pb-3 text-xs text-gold-700"
                  >
                    {r.today}
                  </span>
                )}
                <Tabs.Tab
                  value={String(i)}
                  className={cn(
                    "min-h-11 min-w-[76px] cursor-pointer border-b-2 focus-visible:-outline-offset-2 px-3 pt-3.5 pb-4 font-heading text-2xl tabular-nums hover:text-gold-700",
                    it.planned ? "border-dashed italic" : "border-solid",
                    i === active ? "border-gold text-gold-700" : "border-gold/35 text-ink/60",
                  )}
                >
                  {it.year}
                </Tabs.Tab>
              </div>
            ))}
          </Tabs.List>
        </div>

        <Tabs.Panel
          key={active}
          value={String(active)}
          data-motion="roadmap-panel"
          className="grid grid-cols-1 items-baseline gap-x-[clamp(24px,4vw,64px)] gap-y-4 pt-10 md:grid-cols-[minmax(0,auto)_minmax(0,1fr)]"
        >
          <span
            className={cn(
              "font-heading leading-[0.9] tabular-nums [overflow-wrap:anywhere]",
              cur.year.length > 6
                ? "text-[clamp(32px,5vw,56px)]"
                : "text-[clamp(64px,9vw,128px)]",
              cur.planned ? "text-gold-700 italic" : "text-gold-700",
            )}
          >
            {cur.year}
          </span>
          <div>
            <span className={cn("tag", cur.planned ? "tag-outline" : "tag-accent")}>
              {cur.planned ? r.status.planned : r.status.done}
            </span>
            <p className="mt-3 max-w-[32ch] font-heading text-[clamp(24px,2.4vw,32px)] leading-[1.3]">
              {cur.text}
            </p>
          </div>
        </Tabs.Panel>
      </Tabs.Root>
    </section>
  );
}
