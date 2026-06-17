"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS } from "./data";

function Wordmark() {
  return (
    <a href="#top" className="flex items-center gap-3" aria-label="Вайт групп">
      <Image
        src="/brand/mark-dark.png"
        alt="Вайт групп лого"
        width={290}
        height={254}
        priority
        className="h-9 w-auto"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[17px] font-extrabold tracking-[0.14em] text-brand-ink">
          ВАЙТ ГРУПП
        </span>
        <span className="mt-1 text-[9.5px] font-semibold tracking-[0.28em] text-brand-gold">
          WHITE GROUP LLC
        </span>
      </span>
    </a>
  );
}

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      id="top"
      className={cn(
        "sticky top-0 z-50 border-b border-transparent backdrop-blur-md transition-[border-color,box-shadow] supports-[backdrop-filter]:bg-brand-bg/75",
        scrolled && "border-brand-line shadow-[0_6px_24px_-18px_rgba(33,26,14,0.5)]",
      )}
    >
      <div className="mx-auto flex h-[74px] w-full max-w-6xl items-center justify-between px-5 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative py-1 text-[14.5px] font-medium text-brand-ink-2 transition-colors hover:text-brand-ink"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-brand-gold transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            nativeButton={false}
            render={<a href="#contact" />}
            className="hidden h-11 rounded-full bg-brand-ink px-5 text-[15px] text-white hover:bg-black sm:inline-flex"
          >
            Холбоо барих
            <ArrowRight className="size-4" />
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="rounded-xl border-brand-line text-brand-ink md:hidden"
                  aria-label="Цэс"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-brand-bg p-0 text-brand-ink">
              <SheetTitle className="px-6 pt-6 font-display text-base font-extrabold tracking-[0.14em] text-brand-ink">
                ВАЙТ ГРУПП
              </SheetTitle>
              <nav className="mt-2 flex flex-col px-4">
                {[...NAV_LINKS, { href: "#contact", label: "Холбоо барих" }].map(
                  (link) => (
                    <SheetClose
                      key={link.href}
                      nativeButton={false}
                      render={<a href={link.href} />}
                      className="border-b border-brand-line py-4 text-[15px] font-medium text-brand-ink-2"
                    >
                      {link.label}
                    </SheetClose>
                  ),
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
