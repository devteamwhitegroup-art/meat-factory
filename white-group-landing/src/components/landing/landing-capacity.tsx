import Image from "next/image";

import type { Copy } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingCapacity({ t }: { t: Copy }) {
  const c = t.cap;
  return (
    <section id="capacity" className="scroll-mt-20 py-26">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-x-[clamp(32px,6vw,96px)] gap-y-8">
        <SectionHeading kicker={c.kicker} title={c.title} />
        <p className="text-justify hyphens-auto text-ink/80">{c.sub}</p>
      </div>

      <figure className="plate relative mt-12 aspect-[21/9] overflow-hidden">
        <Image
          src="/photos/cutting-team.jpg"
          alt=""
          fill
          sizes="(min-width: 1200px) 1100px, 100vw"
          className="object-cover object-[center_55%]"
        />
      </figure>

      <div className="mt-14 grid gap-x-[clamp(32px,5vw,80px)] gap-y-12 lg:grid-cols-3">
        <div className="flex flex-col gap-7">
          {c.big.map((b) => (
            <div key={b.l} className="flex items-baseline gap-[18px] border-b border-line pb-[22px]">
              <span className="min-w-[4.2ch] font-heading text-[52px] leading-none tabular-nums">{b.n}</span>
              <span className="text-[13px] tracking-[0.08em] text-ink/72 uppercase">{b.l}</span>
            </div>
          ))}
        </div>
        <div className="min-w-0 overflow-x-auto lg:col-span-2">
          <table className="w-full min-w-[460px] text-[15.5px] tabular-nums">
            <thead>
              <tr className="border-b border-ink text-left text-[12.5px] tracking-[0.08em] text-ink/72 uppercase">
                {c.th.map((h, i) => (
                  <th key={h} className={`pb-3 font-normal ${i === 2 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rows.map(([area, size, cap]) => (
                <tr key={area} className="border-b border-line">
                  <td className="py-[15px] pr-4">{area}</td>
                  <td className="py-[15px] pr-4 text-ink/75">{size}</td>
                  <td className="py-[15px] text-right">{cap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
