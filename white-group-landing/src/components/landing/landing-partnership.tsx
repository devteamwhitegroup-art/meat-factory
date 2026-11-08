import Image from "next/image";

import type { Copy } from "./data";
import { SectionHeading } from "./section-heading";

const DASH =
  "relative list-none pl-5 before:absolute before:left-0 before:content-['—']";

export function LandingPartnership({ t, onPick }: { t: Copy; onPick: (i: number | null) => void }) {
  const p = t.partner;
  return (
    <section id="partner" className="scroll-mt-20 bg-surface">
      <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)] py-18 sm:py-26">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-x-[clamp(32px,6vw,96px)] gap-y-6">
          <SectionHeading title={p.title} />
          <p className="text-ink/80">{p.sub}</p>
        </div>

        <figure className="plate relative mt-12 aspect-video overflow-hidden sm:aspect-[21/9]">
          <Image
            src="/photos/cutting-team.jpg"
            alt=""
            fill
            sizes="(min-width: 1200px) 1100px, 100vw"
            className="object-cover object-[center_55%]"
          />
        </figure>

        <div className="mt-14 grid gap-y-10 md:grid-cols-3">
          {p.options.map((o, i) => (
            <div
              key={o.title}
              className="flex flex-col border-t border-line pt-8 first:border-t-0 first:pt-0 md:border-t-0 md:border-l md:pt-0 md:pr-6 md:pl-6 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
            >
              <h3 className="font-heading text-[clamp(24px,2.4vw,32px)] leading-[1.2]">{o.title}</h3>
              <p className="mt-3 text-[15.5px] text-ink/80">{o.who}</p>

              <h4 className="mt-7 text-[13px] text-ink/70">{p.offerL}</h4>
              <ul className="mt-2 flex flex-col gap-2 text-[15.5px]">
                {o.offer.map((x) => (
                  <li key={x} className={DASH}>
                    {x}
                  </li>
                ))}
              </ul>

              {o.need.length > 0 && (
                <>
                  <h4 className="mt-7 text-[13px] text-ink/70">{p.needL}</h4>
                  <ul className="mt-2 flex flex-col gap-2 text-[15.5px]">
                    {o.need.map((x) => (
                      <li key={x} className={DASH}>
                        {x}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="mt-auto pt-8">
                <a
                  href="#contact"
                  onClick={() => {
                    onPick(i);
                    // After the smooth scroll lands, move focus to Name (type is already set).
                    setTimeout(() => document.getElementById("c-name")?.focus({ preventScroll: true }), 700);
                  }}
                  className="btn btn-primary min-h-12 w-full px-5 py-3 text-base md:w-auto"
                >
                  {o.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
