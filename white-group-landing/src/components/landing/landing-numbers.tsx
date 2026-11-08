import { cn } from "@/lib/utils";
import type { Copy } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingNumbers({ t }: { t: Copy }) {
  const n = t.numbers;
  return (
    <section id="numbers" className="scroll-mt-20 py-18 sm:py-26">
      <SectionHeading title={n.title} />
      <div data-motion="numbers-count" className="mt-12 grid grid-cols-2 border-t border-line lg:grid-cols-4">
        {n.items.map((it, i) => (
          <div
            key={i}
            className={cn(
              "border-b border-line py-8 pr-5",
              i % 2 === 0 ? "border-r pl-0" : "pl-5",
              i % 4 === 0 ? "lg:pl-0" : "lg:pl-5",
              i % 4 !== 3 && "lg:border-r",
            )}
          >
            <div
              data-count={it.n}
              className="font-heading text-[clamp(40px,4vw,56px)] leading-none tabular-nums [overflow-wrap:anywhere]"
            >
              {it.n}
            </div>
            <div className="mt-3 text-[13px] text-ink/70">{it.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
