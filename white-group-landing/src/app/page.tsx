"use client";

import { useEffect, useState } from "react";

import { COPY, type Lang } from "@/components/landing/data";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingProcess } from "@/components/landing/landing-process";
import { LandingCapacity } from "@/components/landing/landing-capacity";
import { LandingProducts } from "@/components/landing/landing-products";
import { LandingFounder } from "@/components/landing/landing-founder";
import { LandingStandards } from "@/components/landing/landing-standards";
import { LandingTimeline } from "@/components/landing/landing-timeline";
import { LandingPartners } from "@/components/landing/landing-partners";
import { LandingContact } from "@/components/landing/landing-contact";
import { LandingFooter } from "@/components/landing/landing-footer";

const CONTAINER = "mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)]";

// Client page only for the МН/EN toggle; still prerendered (Mongolian by default).
export default function HomePage() {
  const [lang, setLang] = useState<Lang>("mn");
  const t = COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <>
      <LandingHeader t={t} lang={lang} setLang={setLang} />
      <main>
        <LandingHero t={t} />
        <div className={CONTAINER}>
          <LandingAbout t={t} />
          <hr className="border-line" />
          <LandingProcess t={t} />
          <hr className="border-line" />
          <LandingCapacity t={t} />
          <hr className="border-line" />
          <LandingProducts t={t} />
        </div>
        <LandingFounder t={t} />
        <div className={CONTAINER}>
          <LandingStandards t={t} />
          <hr className="border-line" />
          <LandingTimeline t={t} />
          <hr className="border-line" />
          <LandingPartners t={t} />
          <hr className="border-line" />
          <LandingContact t={t} />
        </div>
      </main>
      <LandingFooter t={t} />
    </>
  );
}
