import Image from "next/image";

import type { Copy } from "./data";
import { Kicker } from "./section-heading";

export function LandingFounder({ t }: { t: Copy }) {
  const f = t.founder;
  return (
    <section id="founder" className="bg-night-deep text-paper">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-x-[clamp(32px,6vw,104px)] gap-y-14 px-[clamp(20px,5vw,72px)] py-28">
        <figure className="plate relative aspect-4/5 overflow-hidden border-paper/12 outline-paper/18">
          <Image
            src="/photos/owner.jpg"
            alt={f.name}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[64%_center]"
          />
        </figure>
        <div>
          <Kicker className="text-gold-400">{f.kicker}</Kicker>
          <blockquote className="mt-7 -indent-[0.34em] font-heading text-[clamp(28px,3vw,40px)] leading-[1.22] tracking-[-0.005em]">
            {f.quote}
          </blockquote>
          <div className="mt-9 flex flex-col gap-1 border-t border-paper/20 pt-[22px]">
            <span className="font-heading text-[22px] font-semibold">{f.name}</span>
            <span className="text-sm text-paper/70">{f.role}</span>
          </div>
          <p className="mt-7 max-w-[52ch] text-justify text-[15.5px] leading-[1.7] hyphens-auto text-paper/78">{f.body}</p>
        </div>
      </div>
    </section>
  );
}
