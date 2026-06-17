import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HERO_STATS } from "./data";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 70% at 88% 8%, rgba(217,178,74,0.16), transparent 60%), radial-gradient(50% 60% at -5% 90%, rgba(182,137,42,0.10), transparent 60%)",
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <div className="grid items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:py-20">
          {/* copy */}
          <div className="order-2 md:order-1">
            <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-brand-line bg-brand-cream px-4 py-2 text-xs font-semibold tracking-[0.16em] text-brand-gold-deep uppercase">
              <span className="size-1.5 rounded-full bg-brand-gold ring-4 ring-brand-gold/20" />
              Дорнод аймаг · 2008 оноос хойш
            </span>
            <h1 className="font-display text-[clamp(30px,4.6vw,56px)] leading-[1.06] font-extrabold tracking-tight text-brand-ink">
              Мал, мах, махан бүтээгдэхүүний{" "}
              <span className="bg-gradient-to-b from-transparent from-[62%] to-brand-gold-bright/35 to-[62%] px-0.5 text-brand-gold-deep">
                найдвартай нийлүүлэгч
              </span>
            </h1>
            <p className="mt-6 max-w-[33em] text-[17px] text-brand-muted">
              “Вайт групп” ХХК нь 17 жилийн турш Дорнод, Сүхбаатар нутгаас мал,
              мах, малын гаралтай бүтээгдэхүүн бэлтгэн дотоодын зах зээл болон
              экспортын эрхтэй үйлдвэрүүдэд тогтвортой нийлүүлж байна.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                nativeButton={false}
                render={<a href="#capacity" />}
                className="h-12 flex-1 rounded-full bg-brand-ink px-6 text-[15px] text-white hover:bg-black sm:flex-none"
              >
                Үйлдвэрийн чадамж
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href="#about" />}
                className="h-12 flex-1 rounded-full border-brand-line bg-transparent px-6 text-[15px] text-brand-ink hover:border-brand-gold hover:bg-transparent hover:text-brand-gold-deep sm:flex-none"
              >
                Танилцуулга
              </Button>
            </div>
          </div>

          {/* brand card */}
          <div className="brand-gold-gradient relative order-1 flex min-h-[230px] flex-col items-center justify-center overflow-hidden rounded-3xl px-7 py-9 text-center shadow-[0_30px_60px_-28px_rgba(138,101,22,0.65)] md:order-2 md:min-h-[380px] md:p-13">
            <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/30 md:inset-4" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(80% 60% at 50% 0, rgba(255,255,255,0.30), transparent 55%)",
              }}
            />
            <Image
              src="/brand/logo-white.png"
              alt="Вайт групп"
              width={490}
              height={417}
              priority
              className="relative z-10 w-[58%] max-w-[200px] drop-shadow-[0_6px_16px_rgba(120,86,12,0.4)] md:max-w-[260px]"
            />
            <div className="relative z-10 mt-4 text-[11px] font-semibold tracking-[0.3em] text-white/90">
              ВАЙТ ГРУППИЙН ТАНИЛЦУУЛГА
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="mb-16 grid gap-px overflow-hidden rounded-2xl bg-brand-line ring-1 ring-brand-line shadow-[0_1px_2px_rgba(33,26,14,0.04),0_12px_32px_-12px_rgba(33,26,14,0.14)] sm:grid-cols-2 lg:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="bg-white p-6">
              <div className="font-display text-[27px] leading-tight font-extrabold tracking-tight text-brand-ink">
                {stat.value}
                {stat.unit && (
                  <span className="text-[15px] font-bold text-brand-gold-deep">
                    {stat.unit}
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[13px] text-brand-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
