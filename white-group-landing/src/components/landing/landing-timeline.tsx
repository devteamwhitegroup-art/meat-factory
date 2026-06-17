import { TIMELINE } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingTimeline() {
  return (
    <section id="history" className="scroll-mt-20 bg-brand-cream py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <SectionHeading kicker="17 жилийн туршлага" title="Бидний замнал · 2008–2025" />
        <div className="relative">
          {/* vertical rail */}
          <div className="absolute top-2 bottom-2 left-2 w-0.5 bg-gradient-to-b from-brand-gold-bright to-brand-line md:left-[60px]" />
          <ol className="space-y-1">
            {TIMELINE.map((ev, i) => (
              <li
                key={ev.year}
                className="relative grid gap-1 py-2.5 pl-10 md:grid-cols-[120px_1fr] md:gap-7 md:pl-0"
              >
                <span
                  className={`absolute top-2 left-[3px] size-3 rounded-full border-[3px] border-brand-gold ring-4 ring-brand-cream md:left-[55px] ${
                    i % 2 === 1 ? "bg-brand-gold" : "bg-white"
                  }`}
                />
                <span className="font-display text-xl font-extrabold text-brand-gold-deep">
                  {ev.year}
                </span>
                <p className="text-base text-brand-ink-2 md:pl-9">{ev.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
