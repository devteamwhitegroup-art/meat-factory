import Image from "next/image";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Copy, Lang } from "./data";

export function LandingHeader({
  t,
  lang,
  setLang,
}: {
  t: Copy;
  lang: Lang;
  setLang: (lang: Lang) => void;
}) {
  return (
    <nav className="sticky top-0 z-50 flex items-center gap-x-4 gap-y-3 sm:gap-x-7 border-b border-line bg-paper px-[clamp(20px,5vw,72px)] py-3.5">
      <a href="#top" className="flex shrink-0 items-center gap-3 text-ink no-underline">
        <Image src="/brand/mark-dark.png" alt="" width={290} height={254} className="h-8 w-auto" />
        <span className="flex flex-col leading-[1.05]">
          <span className="font-heading text-[19px] font-semibold tracking-[0.06em] whitespace-nowrap">
            ВАЙТ ГРУПП
          </span>
          <span className="text-[10.5px] tracking-[0.18em] whitespace-nowrap text-gold-700">
            WHITE GROUP LLC
          </span>
        </span>
      </a>

      <div className="hidden flex-1 justify-center gap-x-[22px] text-[14.5px] xl:flex">
        {t.nav.map((n) => (
          <a key={n.href} href={n.href} className="whitespace-nowrap text-ink hover:text-gold-700">
            {n.label}
          </a>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3.5 xl:ml-0">
        <div role="group" aria-label={t.langLabel} className="flex overflow-hidden rounded-md border border-line text-[12.5px] tracking-[0.08em]">
          {(["mn", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={cn(
                "min-h-11 min-w-11 cursor-pointer px-2.5 not-first:border-l not-first:border-line max-sm:border-l-0",
                // phones show only the language to switch to; both buttons do not fit at 360px
                lang === l ? "bg-ink text-paper max-sm:hidden" : "text-ink",
              )}
            >
              {l === "mn" ? "МН" : "EN"}
            </button>
          ))}
        </div>
        <a href="#contact" className="btn btn-primary hidden min-h-11 shrink-0 whitespace-nowrap xl:inline-flex">
          {t.cta}
        </a>

        <Sheet>
          <SheetTrigger className="btn btn-secondary btn-icon xl:hidden" aria-label={t.menu}>
            <Menu className="size-[18px]" strokeWidth={1.6} />
          </SheetTrigger>
          <SheetContent side="right" className="bg-paper p-0 text-ink">
            <SheetTitle className="px-6 pt-6 font-heading text-lg font-semibold tracking-[0.06em]">
              ВАЙТ ГРУПП
            </SheetTitle>
            <nav className="flex flex-col px-6">
              {t.nav.map((n) => (
                <SheetClose
                  key={n.href}
                  nativeButton={false}
                  render={<a href={n.href} />}
                  className="flex min-h-[52px] items-center border-b border-line text-[15px] text-ink"
                >
                  {n.label}
                </SheetClose>
              ))}
              <SheetClose
                nativeButton={false}
                render={<a href="#contact" />}
                className="btn btn-primary mt-6 min-h-12 w-full"
              >
                {t.cta}
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
