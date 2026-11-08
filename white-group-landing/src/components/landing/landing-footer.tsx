import Image from "next/image";

import { CERTS, CONTACT, type Copy } from "./data";

const LINK = "block py-2 text-paper/82 hover:text-gold-300";

export function LandingFooter({ t }: { t: Copy }) {
  return (
    <footer className="bg-night-deep text-paper">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-x-12 gap-y-8 px-[clamp(20px,5vw,72px)] pt-16 pb-10">
        <div className="flex max-w-[420px] flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <Image src="/brand/mark-white.png" alt="" width={290} height={254} className="h-9 w-auto" />
            <span className="font-heading text-2xl font-semibold tracking-[0.06em]">
              ВАЙТ ГРУПП{" "}
              <span className="text-[13px] tracking-[0.18em] whitespace-nowrap text-gold-400">WHITE GROUP LLC</span>
            </span>
          </div>
          <p className="text-[14.5px] leading-[1.65] text-paper/72">{t.footer.blurb}</p>
          <div className="flex flex-wrap gap-2">
            {CERTS.map((c) => (
              <span key={c} className="tag tag-outline border-gold-400 text-xs tracking-[0.08em] text-gold-300">
                {c}
              </span>
            ))}
          </div>
        </div>
        <nav className="text-[14.5px]">
          {t.nav.map((n) => (
            <a key={n.href} href={n.href} className={LINK}>
              {n.label}
            </a>
          ))}
        </nav>
        <address className="text-[14.5px] not-italic">
          <a href={CONTACT.phoneHref} className={LINK}>
            {CONTACT.phone}
          </a>
          <a href={`mailto:${CONTACT.email}`} className={LINK}>
            {CONTACT.email}
          </a>
          <p className="max-w-[26ch] py-2 text-paper/82">{t.contact.addr}</p>
        </address>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-x-6 gap-y-2 border-t border-paper/14 px-[clamp(20px,5vw,72px)] pt-5 pb-8 text-[12.5px] text-paper/62">
        <span>
          {t.footer.copy} · {t.footer.regNo}
        </span>
        <span>{t.footer.places}</span>
      </div>
    </footer>
  );
}
