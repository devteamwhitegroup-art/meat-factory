"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { MAP_NODES, type Copy } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingAbout({ t }: { t: Copy }) {
  const [region, setRegion] = useState(0);
  const a = t.about;

  return (
    <section
      id="about"
      className="grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-x-[clamp(32px,6vw,96px)] gap-y-14 pt-28 pb-26"
    >
      <div>
        <SectionHeading kicker={a.kicker} title={a.title} />
        <p className="mt-[26px] text-justify hyphens-auto text-ink/80">{a.p1}</p>
        <p className="mt-4 text-justify hyphens-auto text-ink/80">{a.p2}</p>
        <div className="mt-9 border-t border-line">
          {a.regions.map((r, i) => (
            <button
              key={r.name}
              type="button"
              aria-pressed={i === region}
              onClick={() => setRegion(i)}
              className="grid w-full cursor-pointer grid-cols-[28px_minmax(0,1fr)] gap-x-3.5 gap-y-1 border-b border-line py-[18px] text-left hover:bg-gold/6"
            >
              <span className={cn("pt-0.5 font-heading text-xl tabular-nums", i === region ? "text-gold" : "text-ink/45")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "font-heading text-[22px] leading-[1.2] font-semibold",
                  i === region ? "text-gold-700" : "text-ink",
                )}
              >
                {r.name}
              </span>
              <span />
              <span className="text-[15px] leading-[1.6] text-ink/75">{r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <figure className="sticky top-[100px]">
        <div className="relative aspect-10/7 overflow-hidden rounded-md border border-line bg-surface/60">
          <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            <g className="stroke-line" strokeWidth={0.15}>
              <line x1="0" y1="17.5" x2="100" y2="17.5" />
              <line x1="0" y1="35" x2="100" y2="35" />
              <line x1="0" y1="52.5" x2="100" y2="52.5" />
              <line x1="25" y1="0" x2="25" y2="70" />
              <line x1="50" y1="0" x2="50" y2="70" />
              <line x1="75" y1="0" x2="75" y2="70" />
            </g>
            <path d="M78 26 Q 82 24 86 27" fill="none" className="stroke-gold" strokeWidth={0.5} />
            <path d="M60 52 Q 76 46 86 27" fill="none" className="stroke-gold" strokeWidth={0.5} />
            <path d="M86 27 Q 50 22 14 40" fill="none" className="stroke-ink" strokeWidth={0.35} strokeDasharray="1.2 1" />
          </svg>

          {MAP_NODES.map((m, i) => {
            const on = m.region === region;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRegion(m.region)}
                style={{ left: `${m.x}%`, top: `${(m.y / 70) * 100}%` }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1.5 p-1"
              >
                <span
                  className={cn(
                    "rounded-full border-[1.5px] border-gold transition-all duration-250",
                    m.factory ? "size-2.5 bg-gold" : on ? "size-3.5 bg-gold ring-8 ring-gold/18" : "size-3.5 bg-paper",
                  )}
                />
                <span
                  className={cn(
                    "text-xs tracking-[0.06em] whitespace-nowrap uppercase",
                    on ? "text-gold-700" : "text-ink/72",
                  )}
                >
                  {a.mapLabels[i]}
                </span>
              </button>
            );
          })}

          <span className="absolute bottom-2.5 left-3.5 text-[11.5px] tracking-[0.06em] text-ink/62">{a.mapNote}</span>
          <span className="absolute top-2.5 right-3.5 font-heading text-base text-gold-700">N ↑</span>
        </div>
        <figcaption className="mt-3 flex flex-wrap gap-[18px] text-[12.5px] text-ink/70">
          <span className="flex items-center gap-2">
            <span className="h-[1.5px] w-[22px] bg-gold" />
            {a.legend1}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-[22px] border-t-[1.5px] border-dashed border-ink" />
            {a.legend2}
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
