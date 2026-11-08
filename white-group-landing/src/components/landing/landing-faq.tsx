import { Plus } from "lucide-react";

import { CONTACT, type Copy } from "./data";
import { SectionHeading } from "./section-heading";

// Replace {phone} with a live tel: link.
export function withPhone(text: string) {
  return text.split("{phone}").flatMap((part, i, arr) =>
    i < arr.length - 1
      ? [part, <a key={i} href={CONTACT.phoneHref} className="text-gold-700 underline">{CONTACT.phone}</a>]
      : [part],
  );
}

export function LandingFaq({ t }: { t: Copy }) {
  const f = t.faq;
  if (f.items.length === 0) return null;
  return (
    <section
      id="faq"
      className="grid scroll-mt-20 gap-x-[clamp(32px,6vw,96px)] gap-y-10 py-18 sm:py-26 lg:grid-cols-[1fr_2fr]"
    >
      <div>
        <SectionHeading title={f.title} />
        <p className="mt-6 text-ink/80">
          {f.more}{" "}
          <a href="#contact" className="text-gold-700 underline">
            {f.moreLink} →
          </a>
        </p>
      </div>
      <div className="border-t border-line">
        {f.items.map((it) => (
          <details key={it.q} name="faq" data-motion="faq-item" className="group border-b border-line">
            <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-4 py-4 marker:hidden hover:text-gold-700 [&::-webkit-details-marker]:hidden">
              <span className="font-heading text-[22px] leading-[1.25] font-semibold">{it.q}</span>
              <Plus
                aria-hidden
                className="mt-1 size-[18px] shrink-0 transition-transform group-open:rotate-45"
                strokeWidth={1.6}
              />
            </summary>
            <p className="max-w-[62ch] pb-5 text-[15.5px] text-ink/80">{withPhone(it.a)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
