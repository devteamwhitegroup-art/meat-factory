import Image from "next/image";

import { CERTS, VIDEOS, type Copy } from "./data";

// React doesn't always emit `muted` in SSR HTML, which blocks autoplay — force it.
export const playMuted = (el: HTMLVideoElement | null) => {
  if (!el) return;
  el.muted = true;
  el.play().catch(() => {});
};

const GRADE = "object-cover object-[center_40%]";

export function LandingHero({ t, onPick }: { t: Copy; onPick: (i: number | null) => void }) {
  return (
    <section
      id="top"
      className="relative flex min-h-[88svh] flex-col justify-end overflow-hidden bg-night text-paper sm:min-h-[min(84vh,800px)]"
    >
      <div data-motion="hero-photo" className="absolute inset-0">
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
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-night/92 via-night/55 via-55% to-night/30" />

      <div
        data-motion="hero-sequence"
        className="relative mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,72px)] pt-[120px] pb-10"
      >
        <span
          data-step="kicker"
          className="block text-[13px] tracking-[0.14em] text-gold-400 uppercase tabular-nums"
        >
          {t.hero.kicker}
        </span>
        <h1
          data-step="headline"
          className="mt-[22px] max-w-[15ch] font-heading text-[clamp(40px,6.4vw,92px)] leading-[1.04] font-normal tracking-[-0.012em]"
        >
          <span className="block">{t.hero.l1}</span>
          <span className="block">{t.hero.l2}</span>
        </h1>
        {/* min-h reserves the MN height so the language swap doesn't shift layout */}
        <p
          data-step="sub"
          className="mt-7 min-h-[8lh] max-w-[58ch] text-[16.5px] leading-[1.65] text-paper/88 sm:min-h-[5lh] sm:text-[17.5px]"
        >
          {t.hero.sub}
        </p>
        <div data-step="ctas" className="mt-[34px] flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
          <a
            href="#contact"
            onClick={() => onPick(null)}
            className="btn btn-primary min-h-12 border-gold-400 px-[22px] py-3 text-center text-base text-gold-300"
          >
            {t.cta}
          </a>
          <a
            href="#contact"
            onClick={() => {
              onPick(0);
              setTimeout(() => document.getElementById("c-name")?.focus({ preventScroll: true }), 700);
            }}
            className="btn min-h-12 border-paper/40 px-[22px] py-3 text-center text-base text-paper hover:bg-paper/10 active:bg-paper/16"
          >
            {t.hero.ctaDeck}
          </a>
        </div>
        <div
          data-step="certs"
          className="mt-14 flex flex-wrap gap-2 border-t border-paper/22 pt-[26px]"
        >
          {CERTS.map((c) => (
            <span key={c} className="tag tag-outline border-gold-400 text-[12.5px] tracking-[0.08em] text-gold-300">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
