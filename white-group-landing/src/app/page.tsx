"use client";

import { useEffect, useRef, useState } from "react";

import { useCountUp } from "@/components/landing/use-count-up";

import { COPY, type Lang } from "@/components/landing/data";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNumbers } from "@/components/landing/landing-numbers";
import { LandingOrder } from "@/components/landing/landing-order";
import { LandingModel } from "@/components/landing/landing-model";
import { LandingMarket } from "@/components/landing/landing-market";
import { LandingRoadmap } from "@/components/landing/landing-roadmap";
import { LandingPartnership } from "@/components/landing/landing-partnership";
import { LandingTeam } from "@/components/landing/landing-team";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingContact } from "@/components/landing/landing-contact";
import { LandingFooter } from "@/components/landing/landing-footer";

const CONTAINER = "mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)]";

function OrderStrip({ text }: { text: string }) {
  const [lead, ...rest] = text.split(" — ");
  return (
    <a
      href="#order"
      className="flex min-h-11 items-center justify-center border-b border-line bg-surface px-4 py-2 text-center text-[15px] text-ink focus-visible:-outline-offset-2"
    >
      <span>
        {lead}
        {rest.length > 0 && (
          <>
            {" — "}
            <span className="text-gold-700 underline">{rest.join(" — ")}</span> →
          </>
        )}
      </span>
    </a>
  );
}

// Client page only for the МН/EN toggle; still prerendered (Mongolian by default).
export default function HomePage() {
  const [lang, setLang] = useState<Lang>("mn");
  // Form partner type (index into contact.types), set by the hero / partnership CTAs.
  const [partnerType, setPartnerType] = useState<number | null>(null);
  const t = COPY[lang];
  // Order section reports whether any package is on sale; until then its nav link + strip stay hidden.
  const [selling, setSelling] = useState(false);
  const nav = selling ? t : { ...t, nav: t.nav.filter((n) => n.href !== "#order") };

  const first = useRef(true);
  useEffect(() => {
    document.documentElement.lang = lang;
    // short crossfade on language swap (skipped on first render and for reduced motion)
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document
      .querySelector("[data-motion=lang-swap]")
      ?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
  }, [lang]);

  useCountUp();

  return (
    <>
      <LandingHeader t={nav} lang={lang} setLang={setLang} />
      <main data-motion="lang-swap">
        {selling && t.order.strip && <OrderStrip text={t.order.strip} />}
        <LandingHero t={t} onPick={setPartnerType} />
        <div className={CONTAINER}>
          <LandingNumbers t={t} />
        </div>
        <LandingModel t={t} />
        <div className={CONTAINER}>
          <LandingOrder t={t} onSelling={setSelling} />
          {selling && <hr className="border-line" />}
          <LandingMarket t={t} />
          <hr className="border-line" />
          <LandingRoadmap t={t} />
        </div>
        <LandingPartnership t={t} onPick={setPartnerType} />
        <LandingTeam t={t} />
        <div className={CONTAINER}>
          <LandingFaq t={t} />
          <hr className="border-line" />
          <LandingContact t={t} partnerType={partnerType} setPartnerType={setPartnerType} />
        </div>
      </main>
      <LandingFooter t={nav} />
    </>
  );
}
