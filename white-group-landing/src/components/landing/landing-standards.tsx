import { Card } from "@/components/ui/card";
import { STANDARDS } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingStandards() {
  return (
    <section id="standards" className="scroll-mt-20 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <SectionHeading
          kicker="Чанарын стандарт"
          title="Олон улсын стандартаар баталгаажсан"
          description="Хүнсний аюулгүй байдал, чанарын менежмент, эрүүл ахуйн стандартыг үйлдвэрлэлдээ нэвтрүүлсэн."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {STANDARDS.map((std) => (
            <Card
              key={std.title}
              className="gap-0 rounded-2xl bg-white p-8 ring-brand-line transition-all hover:-translate-y-1 hover:shadow-[0_24px_48px_-22px_rgba(138,101,22,0.5)]"
            >
              <div className="mb-5 grid size-15 place-items-center rounded-2xl bg-gradient-to-br from-brand-gold-bright to-brand-gold font-display text-2xl font-extrabold text-white shadow-[0_10px_22px_-10px_rgba(138,101,22,0.7)]">
                {std.seal}
              </div>
              <div className="mb-3 text-[13px] font-bold tracking-[0.1em] text-brand-gold">
                {std.year}
              </div>
              <h3 className="mb-2 text-xl font-extrabold text-brand-ink">
                {std.title}
              </h3>
              <p className="text-[14.5px] text-brand-muted">{std.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
