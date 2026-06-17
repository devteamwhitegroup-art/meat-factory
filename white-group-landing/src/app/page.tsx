import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingCapacity } from "@/components/landing/landing-capacity";
import { LandingStandards } from "@/components/landing/landing-standards";
import { LandingTimeline } from "@/components/landing/landing-timeline";
import { LandingPartners } from "@/components/landing/landing-partners";
import { LandingContact } from "@/components/landing/landing-contact";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-ink">
      <LandingHeader />
      <LandingHero />
      <LandingAbout />
      <LandingCapacity />
      <LandingStandards />
      <LandingTimeline />
      <LandingPartners />
      <LandingContact />
      <LandingFooter />
    </main>
  );
}
