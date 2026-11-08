import Image from "next/image";

import type { Copy } from "./data";
import { LandingFounder } from "./landing-founder";
import { SectionHeading } from "./section-heading";

export function LandingTeam({ t }: { t: Copy }) {
  const tm = t.team;
  const p = t.partners;
  return (
    <section id="team" className="scroll-mt-20">
      <LandingFounder t={t} />
      <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)] py-18 sm:py-26">
        <SectionHeading title={tm.title} />

        {tm.people.length > 0 && (
          <div className="mt-12">
            <h3 className="font-heading text-[clamp(24px,2.4vw,32px)] leading-[1.2]">{tm.peopleTitle}</h3>
            <div className="mt-6 grid border-t border-line md:grid-cols-3">
              {tm.people.map((m, i) => (
                <div
                  key={i}
                  className="border-b border-line py-6 md:border-b-0 md:pr-6 md:not-first:border-l md:not-first:pl-6"
                >
                  <div className="font-heading text-[22px] leading-[1.25] font-semibold">{m.name}</div>
                  <div className="mt-1 text-[13px] text-ink/70">{m.role}</div>
                  <p className="mt-3 text-[15.5px] text-ink/80">{m.bio}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 grid gap-x-[clamp(32px,6vw,96px)] gap-y-14 lg:grid-cols-2">
          <div>
            <h3 className="font-heading text-[clamp(24px,2.4vw,32px)] leading-[1.2]">{tm.certsTitle}</h3>
            <ul className="mt-6 border-t border-line">
              {t.std.items.map((c) => (
                <li key={c.name} className="border-b border-line py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-heading text-[40px] leading-none text-gold-700">
                      {c.pdf ? (
                        <a href={c.pdf} target="_blank" rel="noopener" className="hover:underline">
                          {c.name}
                          <span className="sr-only"> ({tm.pdf})</span>
                        </a>
                      ) : (
                        c.name
                      )}
                    </span>
                    <span className="text-[13px] text-ink/70 tabular-nums">{c.year}</span>
                  </div>
                  <div className="mt-2 text-[13px] text-ink/70">{c.issuer}</div>
                  <p className="mt-2 text-[15.5px] text-ink/78">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-[clamp(24px,2.4vw,32px)] leading-[1.2]">{p.title}</h3>
            <ul className="mt-6 border-t border-line">
              {p.items.map((item) => (
                <li key={item.name} className="flex justify-between gap-4 border-b border-line py-4">
                  <span className="font-heading text-xl leading-[1.3] font-semibold">{item.name}</span>
                  <span className="shrink-0 text-right text-[13.5px] text-ink/70">{item.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 grid items-center gap-x-[clamp(32px,6vw,96px)] gap-y-8 md:grid-cols-2">
          <figure className="plate relative aspect-4/3 overflow-hidden">
            <Image
              src="/photos/worker-portrait.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-[65%_center]"
            />
          </figure>
          <div>
            <div className="grid grid-cols-2 gap-6">
              {p.jobs.map((j) => (
                <div key={j.l}>
                  <div className="font-heading text-[52px] leading-none tabular-nums">{j.n}</div>
                  <div className="mt-2.5 text-[13px] text-ink/70">{j.l}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[15.5px] leading-[1.65] text-ink/78">{p.csr}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
