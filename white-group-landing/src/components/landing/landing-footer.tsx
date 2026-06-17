import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { NAV_LINKS } from "./data";

export function LandingFooter() {
  return (
    <footer className="bg-brand-ink px-5 pt-16 pb-8 text-white/70 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/brand/mark-white.png"
                alt="Вайт групп"
                width={290}
                height={254}
                className="h-10 w-auto"
              />
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-extrabold tracking-[0.14em] text-white">
                  ВАЙТ ГРУПП
                </span>
                <span className="text-[9.5px] font-semibold tracking-[0.26em] text-brand-gold-bright">
                  WHITE GROUP LLC
                </span>
              </span>
            </div>
            <p className="max-w-[30em] text-[14.5px] leading-relaxed">
              2008 оноос хойш мал, мах, малын гаралтай бүтээгдэхүүн бэлтгэн
              дотоодын зах зээл болон экспортын үйлдвэрүүдэд тогтвортой нийлүүлж
              буй найдвартай түнш.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {["HACCP", "HALAL", "ISO 9001:2016"].map((b) => (
                <Badge
                  key={b}
                  variant="outline"
                  className="border-brand-gold-bright/30 bg-transparent text-[11.5px] font-bold tracking-wide text-brand-gold-bright"
                >
                  {b}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h5 className="mb-4 text-[13px] font-bold tracking-[0.12em] text-white uppercase">
              Цэс
            </h5>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[14.5px] transition-colors hover:text-brand-gold-bright"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-4 text-[13px] font-bold tracking-[0.12em] text-white uppercase">
              Холбоо барих
            </h5>
            <ul className="space-y-2.5 text-[14.5px]">
              <li>
                <a href="#contact" className="hover:text-brand-gold-bright">
                  Дорнод аймаг, Чойбалсан
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-brand-gold-bright">
                  +976 ____ ____
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-brand-gold-bright">
                  info@whitegroup.mn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 text-[13.5px]">
          <span>© 2026 “Вайт групп” ХХК. Бүх эрх хуулиар хамгаалагдсан.</span>
          <span>Дорнод · Сүхбаатар · Улаанбаатар</span>
        </div>
      </div>
    </footer>
  );
}
