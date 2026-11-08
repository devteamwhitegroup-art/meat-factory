import type { Copy } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingMarket({ t }: { t: Copy }) {
  const m = t.market;
  return (
    <section id="market" className="scroll-mt-20 py-18 sm:py-26">
      <div className="grid gap-x-[clamp(32px,6vw,96px)] gap-y-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <SectionHeading title={m.title} />
          <p className="mt-5 max-w-[40ch] text-ink/80">{m.sub}</p>
        </div>
        {m.stats.length > 0 && (
          <div className="grid border-t border-line sm:grid-cols-3 lg:border-t-0">
            {m.stats.map((s, i) => (
              <div
                key={i}
                className="border-b border-line py-6 sm:border-b-0 sm:py-0 sm:pl-6 sm:not-first:border-l sm:first:pl-0 lg:first:pl-6 lg:first:border-l"
              >
                <div className="font-heading text-[clamp(40px,4vw,56px)] leading-none tabular-nums [overflow-wrap:anywhere]">
                  {s.n}
                </div>
                <div className="mt-3 text-[13px] text-ink/70">{s.l}</div>
                <div className="mt-3 text-[12.5px] text-ink/70">{s.src}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-14 border-t border-line pt-12">
        <h3 className="font-heading text-[clamp(24px,2.4vw,32px)] leading-[1.2]">{m.whyTitle}</h3>
        <div className="mt-8 grid gap-y-8 md:grid-cols-3">
          {m.why.map((w) => (
            <div key={w.title} className="md:pr-6 md:not-first:border-l md:not-first:border-line md:not-first:pl-6">
              <div className="font-heading text-[22px] leading-[1.25] font-semibold">{w.title}</div>
              <p className="mt-2 text-[15.5px] text-ink/80">{w.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
