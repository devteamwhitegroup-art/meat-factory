import type { Copy } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingStandards({ t }: { t: Copy }) {
  const s = t.std;
  return (
    <section id="standards" className="scroll-mt-20 pt-26 pb-24">
      <SectionHeading kicker={s.kicker} title={s.title} />
      <div className="mt-12 grid border-t border-line md:grid-cols-3">
        {s.items.map((item) => (
          <div
            key={item.name}
            className="border-b border-line pt-8 pb-6 md:mr-7 md:border-r md:border-b-0 md:pr-7 md:pb-2 md:last:mr-0 md:last:border-r-0"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-[40px] leading-none text-gold">{item.name}</span>
              <span className="text-[13px] text-ink/70 tabular-nums">{item.year}</span>
            </div>
            <p className="mt-[18px] text-[15.5px] leading-[1.65] text-ink/78">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
