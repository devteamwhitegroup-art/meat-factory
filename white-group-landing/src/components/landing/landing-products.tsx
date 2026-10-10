import { cn } from "@/lib/utils";
import type { Copy } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingProducts({ t }: { t: Copy }) {
  const p = t.prod;
  return (
    <section id="products" className="scroll-mt-20 py-26">
      <SectionHeading kicker={p.kicker} title={p.title} className="max-w-[20ch]" />
      <div className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-5">
        {p.items.map((item) => (
          <article
            key={item.name}
            className={cn("card gap-2.5 px-[26px] pt-[26px] pb-6", item.export && "border-gold")}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] tracking-[0.08em] text-gold-700 uppercase">{item.kicker}</span>
              {item.export && <span className="tag tag-accent">{p.exportTag}</span>}
            </div>
            <h3 className="font-heading text-[30px] leading-[1.1] font-normal">{item.name}</h3>
            <p className="text-[15px] leading-[1.6] text-ink/75">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
