"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { CONTACT, type Copy } from "./data";
import { Kicker } from "./section-heading";

const ROW = "grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-line py-4";
const DT = "pt-[3px] text-[12.5px] tracking-[0.08em] text-ink/70 uppercase";

export function LandingContact({ t }: { t: Copy }) {
  const [sent, setSent] = useState(false);
  const [buyer, setBuyer] = useState(0);
  const c = t.contact;

  // ponytail: no backend — submit only shows the thank-you state, same as the old page.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <section
      id="contact"
      className="grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-x-[clamp(32px,6vw,96px)] gap-y-14 pt-26 pb-30"
    >
      <div>
        <Kicker>{c.kicker}</Kicker>
        <h2 className="mt-[18px] font-heading text-[clamp(38px,4.4vw,60px)] leading-[1.05] font-normal tracking-[-0.01em]">
          {c.title}
        </h2>
        <p className="mt-[22px] max-w-[46ch] text-ink/80">{c.sub}</p>
        <dl className="mt-9 border-t border-line">
          <div className={ROW}>
            <dt className={DT}>{c.phoneL}</dt>
            <dd className="font-heading text-2xl tabular-nums">
              <a href={CONTACT.phoneHref} className="text-gold-700 hover:text-gold-600">
                {CONTACT.phone}
              </a>
            </dd>
          </div>
          <div className={ROW}>
            <dt className={DT}>{c.emailL}</dt>
            <dd className="font-heading text-2xl break-words">
              <a href={`mailto:${CONTACT.email}`} className="text-gold-700 hover:text-gold-600">
                {CONTACT.email}
              </a>
            </dd>
          </div>
          <div className={ROW}>
            <dt className={DT}>{c.addrL}</dt>
            <dd className="text-base leading-[1.55]">{c.addr}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-8 shadow-[0_1px_2px_rgb(45_43_43/0.14)]">
        {sent ? (
          <div className="flex flex-col items-start gap-3.5 py-6">
            <Check className="size-8 text-gold" strokeWidth={1.4} />
            <h3 className="font-heading text-[28px] font-semibold">{c.thanks}</h3>
            <p className="text-ink/78">{c.thanksBody}</p>
            <button type="button" className="btn btn-ghost" onClick={() => setSent(false)}>
              {c.again}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <h3 className="font-heading text-[26px] font-semibold">{c.formTitle}</h3>
            <div className="mt-[22px] flex flex-col gap-4">
              <div className="field">
                <label htmlFor="c-name">{c.fName}</label>
                <input id="c-name" name="name" className="input" required />
              </div>
              <div className="field">
                <label htmlFor="c-contact">{c.fContact}</label>
                <input id="c-contact" name="contact" className="input" required />
              </div>
              <div className="field">
                <label id="c-buyer">{c.fBuyer}</label>
                <div role="group" aria-labelledby="c-buyer" className="flex flex-wrap gap-2">
                  {c.buyers.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={i === buyer}
                      onClick={() => setBuyer(i)}
                      className={cn(
                        "cursor-pointer rounded-md border px-3 py-[7px] text-[13.5px]",
                        i === buyer ? "border-gold bg-gold/10 text-gold-700" : "border-line text-ink",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="c-msg">{c.fMsg}</label>
                <textarea id="c-msg" name="message" rows={4} className="input min-h-[90px] resize-y" />
              </div>
              <button type="submit" className="btn btn-primary mt-2 w-full p-3 text-base">
                {c.send}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
