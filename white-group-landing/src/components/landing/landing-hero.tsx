import Image from "next/image";

import { VIDEOS, type Copy } from "./data";

// React doesn't always emit `muted` in SSR HTML, which blocks autoplay — force it.
export const playMuted = (el: HTMLVideoElement | null) => {
  if (!el) return;
  el.muted = true;
  el.play().catch(() => {});
};

const GRADE = "object-cover sepia-[.22] saturate-[.82] contrast-[1.05]";

export function LandingHero({ t }: { t: Copy }) {
  return (
    <section
      id="top"
      className="relative flex min-h-[min(90vh,860px)] flex-col justify-end overflow-hidden bg-night text-paper"
    >
      {VIDEOS.hero ? (
        <video
          ref={playMuted}
          src={VIDEOS.hero}
          poster="/photos/cold-room.jpg"
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 size-full ${GRADE}`}
        />
      ) : (
        <Image src="/photos/cold-room.jpg" alt="" fill preload sizes="100vw" className={GRADE} />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-night/92 via-night/55 via-55% to-night/30" />

      <div className="relative mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,72px)] pt-[120px]">
        <span className="block text-[13px] tracking-[0.14em] text-gold-400 uppercase tabular-nums">
          {t.hero.kicker}
        </span>
        <h1 className="mt-[22px] max-w-[15ch] font-heading text-[clamp(46px,6.4vw,92px)] leading-[1.04] font-normal tracking-[-0.012em]">
          <span className="block">{t.hero.l1}</span>
          <span className="block">{t.hero.l2}</span>
        </h1>
        <p className="mt-7 max-w-[58ch] text-[17.5px] leading-[1.65] text-paper/88">{t.hero.sub}</p>
        <div className="mt-[34px] flex flex-wrap gap-3.5">
          <a href="#contact" className="btn btn-primary border-gold-400 px-[22px] py-3 text-base text-gold-300">
            {t.cta}
          </a>
          <a href="#process" className="btn btn-secondary border-paper/40 px-[22px] py-3 text-base text-paper">
            {t.hero.cta2}
          </a>
        </div>
        <div className="mt-[72px] grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-8 gap-y-6 border-t border-paper/22 pt-[30px] pb-10">
          {t.stats.map((s) => (
            <div key={s.n + s.l}>
              <div className="font-heading text-[clamp(36px,3.6vw,50px)] leading-none font-normal tabular-nums">
                {s.n}
              </div>
              <div className="mt-2.5 text-[12.5px] tracking-[0.08em] text-paper/72 uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
