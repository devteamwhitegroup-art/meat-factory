import Image from "next/image";

import type { Copy } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingPartners({ t }: { t: Copy }) {
  const p = t.partners;
  return (
    <section
      id="partners"
      className="grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-x-[clamp(32px,6vw,96px)] gap-y-14 py-26"
    >
      <div>
        <SectionHeading kicker={p.kicker} title={p.title} />
        <ul className="mt-9 border-t border-line">
          {p.items.map((item) => (
            <li key={item.name} className="flex justify-between gap-4 border-b border-line py-4">
              <span className="font-heading text-xl leading-[1.3] font-semibold">{item.name}</span>
              <span className="text-right text-[13.5px] text-ink/70">{item.note}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <figure className="plate relative aspect-4/3 overflow-hidden">
          <Image
            src="/photos/worker-portrait.jpg"
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[65%_center]"
          />
        </figure>
        <div className="mt-8 grid grid-cols-2 gap-6">
          {p.jobs.map((j) => (
            <div key={j.l}>
              <div className="font-heading text-[52px] leading-none tabular-nums">{j.n}</div>
              <div className="mt-2.5 text-[13px] tracking-[0.08em] text-ink/72 uppercase">{j.l}</div>
            </div>
          ))}
        </div>
        <p className="mt-[22px] text-[15.5px] leading-[1.65] text-ink/78">{p.csr}</p>
      </div>
    </section>
  );
}
