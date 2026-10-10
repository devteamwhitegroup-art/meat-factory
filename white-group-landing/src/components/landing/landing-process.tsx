"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, EyeOff, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { STEP_MEDIA, VIDEOS, type Copy } from "./data";
import { playMuted } from "./landing-hero";
import { SectionHeading } from "./section-heading";

const pad = (n: number) => String(n).padStart(2, "0");

export function LandingProcess({ t }: { t: Copy }) {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const p = t.process;
  const n = p.steps.length;
  const media = STEP_MEDIA[step];
  const go = (i: number) => {
    setStep((i + n) % n);
    setRevealed(false);
  };

  let content: React.ReactNode;
  if (media.gate && !revealed) {
    content = (
      <>
        <Image src={media.img} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="scale-[1.12] object-cover blur-[18px] brightness-[.55]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 p-6 text-center text-paper">
          <EyeOff className="size-[30px]" strokeWidth={1.4} />
          <span className="max-w-[22ch] font-heading text-[26px] leading-[1.2]">{p.gateTitle}</span>
          <span className="max-w-[40ch] text-sm text-paper/80">{p.gateBody}</span>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="btn btn-primary mt-1.5 border-gold-400 px-5 py-2.5 text-[15px] text-gold-300"
          >
            <Play className="size-4" strokeWidth={1.6} />
            {p.gateBtn}
          </button>
        </div>
      </>
    );
  } else if (media.gate && VIDEOS.slaughter) {
    content = (
      <video src={VIDEOS.slaughter} poster={media.img} controls autoPlay playsInline className="size-full bg-black object-cover" />
    );
  } else if (media.video) {
    content = (
      <video ref={playMuted} src={media.video} poster={media.img} autoPlay muted loop playsInline className="size-full object-cover" />
    );
  } else {
    content = (
      <>
        <Image
          src={media.img}
          alt={p.steps[step].title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: media.pos }}
        />
        {media.gate && (
          <span className="absolute bottom-4 left-4 rounded-md bg-night/80 px-3 py-1.5 text-[13px] text-paper">
            {p.pending}
          </span>
        )}
      </>
    );
  }

  return (
    <section id="process" className="scroll-mt-20 py-26">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="max-w-[640px]">
          <SectionHeading kicker={p.kicker} title={p.title} />
        </div>
        <div className="flex gap-2.5">
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => go(step - 1)} aria-label={p.prev}>
            <ChevronLeft className="size-[18px]" strokeWidth={1.6} />
          </button>
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => go(step + 1)} aria-label={p.next}>
            <ChevronRight className="size-[18px]" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-x-[clamp(32px,5vw,80px)] gap-y-10">
        <ol className="border-t border-line">
          {p.steps.map((s, i) => {
            const active = i === step;
            const hasVideo = STEP_MEDIA[i].gate || !!STEP_MEDIA[i].video;
            return (
              <li key={s.title} className="border-b border-line">
                <button
                  type="button"
                  aria-expanded={active}
                  onClick={() => go(i)}
                  className="grid w-full cursor-pointer grid-cols-[44px_minmax(0,1fr)] gap-x-3 gap-y-0.5 py-5 text-left hover:bg-gold/6"
                >
                  <span className={cn("font-heading text-[28px] leading-none tabular-nums", active ? "text-gold" : "text-ink/45")}>
                    {pad(i + 1)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-2.5 font-heading text-[22px] leading-[1.25] font-semibold",
                      active ? "text-ink" : "text-ink/70",
                    )}
                  >
                    {s.title}
                    {hasVideo && <span className="tag tag-outline font-sans font-normal">{p.videoTag}</span>}
                  </span>
                  {active && (
                    <>
                      <span />
                      <span className="pt-2 text-[15.5px] leading-[1.65] text-ink/78">{s.body}</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <figure>
          <div className="plate relative aspect-4/3 overflow-hidden bg-night">{content}</div>
          <figcaption className="mt-3.5 flex justify-between gap-4 text-[13px] text-ink/70">
            <span>
              {p.stepWord} {step + 1} · {p.steps[step].title}
            </span>
            <span className="tabular-nums">
              {pad(step + 1)} / {pad(n)}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
