import { Minus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { CAPACITY_CARDS, FACILITY_SPECS } from "./data";
import { SectionHeading } from "./section-heading";

export function LandingCapacity() {
  return (
    <section id="capacity" className="scroll-mt-20 bg-brand-cream py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <SectionHeading
          kicker="Үйлдвэрийн чадамж"
          title="Бойноос хадгалалт хүртэл бүрэн цогц үйлдвэр"
          description="2020 онд Чойбалсангаас зүүн 12 км-т ашиглалтад орсон, 2312 м² талбай бүхий орчин үеийн үйлдвэр."
        />

        <div className="mb-10 grid gap-5 md:grid-cols-3">
          {CAPACITY_CARDS.map((card) => (
            <Card
              key={card.tag + card.value}
              className="relative gap-0 rounded-2xl bg-white p-7 ring-brand-line"
            >
              <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-[radial-gradient(circle,rgba(217,178,74,0.28),transparent_70%)]" />
              <div className="text-xs font-semibold tracking-[0.14em] text-brand-gold-deep uppercase">
                {card.tag}
              </div>
              <div className="mt-3.5 mb-1.5 font-display text-[42px] leading-none font-extrabold text-brand-ink">
                {card.value}
                <span className="ml-1 text-lg font-semibold text-brand-muted">
                  {card.unit}
                </span>
              </div>
              <p className="text-[14.5px] text-brand-muted">{card.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl bg-white p-8 ring-brand-line md:px-9">
          <div className="grid gap-x-10 gap-y-1 sm:grid-cols-2">
            {FACILITY_SPECS.map((spec) => (
              <div
                key={spec}
                className="flex items-start gap-3.5 border-b border-dashed border-brand-line py-2.5 last:border-0 sm:[&:nth-last-child(2)]:border-0"
              >
                <Minus className="mt-1 size-4 flex-none text-brand-gold" />
                <span className="text-[15px] text-brand-ink-2">{spec}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
