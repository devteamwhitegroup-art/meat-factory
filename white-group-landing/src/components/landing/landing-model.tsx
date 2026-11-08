"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Tabs } from "@base-ui/react/tabs";
import { ChevronDown, ChevronLeft, ChevronRight, EyeOff, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { MAP_NODES, STEP_MEDIA, VIDEOS, type Copy } from "./data";
import { playMuted } from "./landing-hero";
import { centerInRail, Kicker } from "./section-heading";

const pad = (n: number) => String(n).padStart(2, "0");
type Stock = "small" | "large";

function RegionMap({ t, hi }: { t: Copy; hi: number[] }) {
  const m = t.model.map;
  return (
    <div className="absolute inset-0 bg-paper/5">
      <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        <g className="stroke-paper/15" strokeWidth={0.15}>
          <line x1="0" y1="17.5" x2="100" y2="17.5" />
          <line x1="0" y1="35" x2="100" y2="35" />
          <line x1="0" y1="52.5" x2="100" y2="52.5" />
          <line x1="25" y1="0" x2="25" y2="70" />
          <line x1="50" y1="0" x2="50" y2="70" />
          <line x1="75" y1="0" x2="75" y2="70" />
        </g>
        <path d="M78 26 Q 82 24 86 27" fill="none" className="stroke-gold" strokeWidth={0.5} />
        <path d="M60 52 Q 76 46 86 27" fill="none" className="stroke-gold" strokeWidth={0.5} />
        <path d="M86 27 Q 50 22 14 40" fill="none" className="stroke-paper/70" strokeWidth={0.35} strokeDasharray="1.2 1" />
      </svg>
      {MAP_NODES.map((n, i) => {
        const on = hi.includes(n.region);
        return (
          <div
            key={i}
            data-motion={on ? "model-map-pulse" : undefined}
            style={{ left: `${n.x}%`, top: `${(n.y / 70) * 100}%` }}
            className={cn(
              "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 p-1",
              !on && "opacity-45",
            )}
          >
            <span
              className={cn(
                "rounded-full border-[1.5px] border-gold",
                n.factory ? "size-2.5 bg-gold" : on ? "size-3.5 bg-gold ring-8 ring-gold/18" : "size-3.5 bg-night-deep",
              )}
            />
            <span className={cn("text-xs whitespace-nowrap", on ? "text-gold-400" : "text-paper/70")}>
              {m.labels[i]}
            </span>
          </div>
        );
      })}
      <span className="absolute bottom-2.5 left-3.5 text-[11.5px] text-paper/62">{m.note}</span>
      <span className="absolute top-2.5 right-3.5 font-heading text-base text-gold-400">N ↑</span>
    </div>
  );
}

export function LandingModel({ t }: { t: Copy }) {
  const [stop, setStop] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [stock, setStock] = useState<Stock>("small");
  const [revealed, setRevealed] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const m = t.model;
  const n = m.stops.length;
  const s = m.stops[stop];
  const media = STEP_MEDIA[stop];

  const select = (i: number) => {
    if (i < 0 || i >= n || i === stop) return;
    setDir(i > stop ? "next" : "prev");
    setStop(i);
    setRevealed(false); // the slaughter gate re-closes when leaving the stop
  };

  // Keep the active stop visible in the scrolling rail (mobile) without moving the page.
  useEffect(() => {
    centerInRail(rail.current, rail.current?.querySelector<HTMLElement>('[aria-selected="true"]'));
  }, [stop]);

  const facts = [...s.facts, ...(s.stockFacts?.[stock] ?? [])];
  const products = t.prod.items.filter((p) => p.stock === stock);

  let content: React.ReactNode;
  if (media.map) {
    content = <RegionMap t={t} hi={media.map} />;
  } else if (media.gate && !revealed) {
    content = (
      <>
        <Image
          src={media.img!}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="scale-[1.12] object-cover blur-[18px] brightness-[.55]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 p-6 text-center text-paper">
          <EyeOff className="size-[30px]" strokeWidth={1.4} />
          <span className="max-w-[22ch] font-heading text-[26px] leading-[1.2]">{m.gateTitle}</span>
          <span className="max-w-[40ch] text-sm text-paper/80">{m.gateBody}</span>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="btn btn-primary min-h-11 border-gold-400 px-5 py-2.5 text-[15px] text-gold-300"
          >
            <Play className="size-4" strokeWidth={1.6} />
            {m.gateBtn}
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
          src={media.img!}
          alt={s.title}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: media.pos }}
        />
        {media.gate && (
          <span className="absolute bottom-4 left-4 rounded-md bg-night/80 px-3 py-1.5 text-[13px] text-paper">
            {m.pending}
          </span>
        )}
      </>
    );
  }

  const stepBtn =
    "btn min-h-11 min-w-11 border-paper/30 px-4 text-paper hover:bg-paper/10 aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <section id="model" className="scroll-mt-20 bg-night-deep text-paper">
      <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)] py-18 sm:py-26">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
          <div className="max-w-[60ch]">
            <Kicker className="text-gold-400">{m.kicker}</Kicker>
            <h2 className="mt-[18px] font-heading text-[clamp(34px,3.8vw,52px)] leading-[1.08] font-normal tracking-[-0.01em]">
              {m.title}
            </h2>
            <p className="mt-5 text-paper/78">{m.sub}</p>
          </div>
          <fieldset className="w-full min-w-0 sm:w-auto">
            <legend className="mb-2 text-[13px] text-paper/62">{m.stockLabel}</legend>
            <div className="flex overflow-hidden rounded-md border border-paper/30">
              {m.stocks.map((label, i) => {
                const v: Stock = i === 0 ? "small" : "large";
                return (
                  <label
                    key={v}
                    className="flex min-h-11 flex-1 cursor-pointer items-center justify-center not-first:border-l not-first:border-paper/30 has-checked:bg-paper has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-gold-600 sm:flex-none sm:px-6"
                  >
                    <input
                      type="radio"
                      name="stock"
                      value={v}
                      checked={stock === v}
                      onChange={() => setStock(v)}
                      className="sr-only"
                    />
                    <span className="px-3 text-[15px]">{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <Tabs.Root value={String(stop)} onValueChange={(v) => select(Number(v))} className="mt-14">
          <div ref={rail} className="relative snap-x overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-[672px]">
              <div aria-hidden className="grid grid-cols-7 text-[13px] text-paper/62">
                <span>{m.groups[0]}</span>
                <span className="col-span-5 border-l border-paper/20 pl-2">{m.groups[1]}</span>
                <span className="border-l border-paper/20 pl-2">{m.groups[2]}</span>
              </div>
              <Tabs.List activateOnFocus className="relative mt-3 grid grid-cols-7">
                {/* route line: dashed to the end, solid gold up to the active stop */}
                <div aria-hidden className="pointer-events-none absolute inset-x-[calc(100%/14)] top-[29px] h-0">
                  <div className="absolute inset-x-0 border-t border-dashed border-gold/35" />
                  <div
                    data-motion="model-route"
                    className="absolute inset-x-0 origin-left border-t-2 border-gold"
                    style={{ transform: `scaleX(${stop / (n - 1)})` }}
                  />
                </div>
                {m.stops.map((st, i) => {
                  const active = i === stop;
                  return (
                    <Tabs.Tab
                      key={st.short}
                      value={String(i)}
                      className="group relative flex min-h-11 cursor-pointer snap-center flex-col items-center gap-1 px-1 pt-1 pb-2 text-center outline-offset-0 focus-visible:outline-2 focus-visible:outline-gold-600"
                    >
                      <span
                        className={cn(
                          "font-heading text-[15px] leading-none tabular-nums",
                          active ? "text-gold-400" : "text-paper/70",
                        )}
                      >
                        {pad(i + 1)}
                      </span>
                      <span
                        className={cn(
                          "my-1.5 size-3.5 rounded-full border-[1.5px] group-hover:border-gold",
                          active ? "border-gold bg-gold ring-8 ring-gold/18" : "border-paper/70 bg-night-deep",
                        )}
                      />
                      <span
                        className={cn(
                          "text-[13px] leading-tight break-words group-hover:text-paper",
                          active ? "font-semibold text-paper" : "text-paper/70 max-md:sr-only",
                        )}
                      >
                        {st.short}
                      </span>
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </div>
          </div>

          <Tabs.Panel
            key={stop}
            value={String(stop)}
            data-motion="model-panel"
            data-dir={dir}
            className="mt-10 grid items-start gap-x-[clamp(32px,5vw,80px)] gap-y-10 lg:grid-cols-2"
          >
            <figure>
              <div className="plate relative aspect-4/3 overflow-hidden border-paper/12 bg-night outline-paper/18">
                {content}
              </div>
              <figcaption className="mt-3.5 text-[13px] text-paper/70">
                {m.stepWord} {stop + 1} · {s.title}
              </figcaption>
            </figure>

            <div>
              <span className="font-heading text-[28px] leading-none text-gold-400 tabular-nums">
                {pad(stop + 1)} / {pad(n)}
              </span>
              <h3 className="mt-3 font-heading text-[clamp(24px,2.4vw,32px)] leading-[1.2]">{s.title}</h3>
              <p className="mt-4 text-paper/82">{s.body}</p>

              {stop === n - 1 ? (
                <div key={stock} data-motion="model-stock" className="mt-6">
                  <h4 className="border-b border-paper/15 pb-2 text-[13px] text-paper/62">{m.productsL}</h4>
                  <ul>
                    {products.map((p) => (
                      <li
                        key={p.name}
                        className="grid grid-cols-1 gap-x-4 gap-y-1 border-b border-paper/15 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
                      >
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {p.name}
                          {p.export && <span className="tag tag-accent">{m.exportTag}</span>}
                        </span>
                        <span className="text-[15px] text-paper/78">{p.body}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                facts.length > 0 && (
                  <dl key={stock} data-motion="model-stock" className="mt-6">
                    {facts.map(([l, v]) => (
                      <div
                        key={l}
                        className="flex flex-col gap-1 border-b border-paper/15 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                      >
                        <dt className="text-[13px] text-paper/62">{l}</dt>
                        <dd className="font-semibold sm:text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )
              )}

              {s.partner && <p className="mt-6 text-[15.5px] text-gold-300">{s.partner}</p>}

              <div className="mt-8 flex justify-between gap-3 sm:justify-start">
                <button type="button" className={stepBtn} aria-disabled={stop === 0} onClick={() => select(stop - 1)}>
                  <ChevronLeft className="size-[18px]" strokeWidth={1.6} />
                  {m.prev}
                </button>
                <button type="button" className={stepBtn} aria-disabled={stop === n - 1} onClick={() => select(stop + 1)}>
                  {m.next}
                  <ChevronRight className="size-[18px]" strokeWidth={1.6} />
                </button>
              </div>
            </div>
          </Tabs.Panel>
        </Tabs.Root>

        <details className="group mt-14 border-t border-paper/15">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-heading text-xl font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
            {m.specs}
            <ChevronDown className="size-5 shrink-0 text-gold-400 transition-transform group-open:rotate-180" strokeWidth={1.6} />
          </summary>
          <div className="pb-2">
            <table className="w-full text-[15.5px] tabular-nums max-sm:text-[14px]">
              <thead>
                <tr className="border-b border-paper/40 text-left text-[13px] text-paper/62">
                  {t.cap.th.map((h, i) => (
                    <th key={h} className={cn("pb-3 font-normal", i === 2 && "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.cap.rows.map(([area, size, cap]) => (
                  <tr key={area} className="border-b border-paper/15">
                    <td className="py-[15px] pr-4">{area}</td>
                    <td className="py-[15px] pr-4 text-paper/75">{size}</td>
                    <td className="py-[15px] text-right">{cap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}
