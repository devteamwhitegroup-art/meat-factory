"use client";

import { useRef, useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { CONTACT, type Copy } from "./data";

// Label above value on phones: a 100px label column leaves too little room for the e-mail.
const ROW = "grid gap-1 border-b border-line py-4 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-4";
const DT = "pt-[3px] text-[13px] text-ink/70";
const FIELD = "input min-h-12 border-ink/50 px-3 text-base hover:border-ink/70";

type Values = { type: number | null; name: string; company: string; contact: string; budget: string; msg: string };
type Errors = { type?: true; name?: true; contact?: true };

// Valid email, or a phone number with at least 8 digits.
const validContact = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || v.replace(/\D/g, "").length >= 8;

function check(k: keyof Errors, v: Values): boolean {
  if (k === "type") return v.type === null;
  if (k === "name") return v.name.trim().length < 2;
  return !validContact(v.contact);
}

// Replace {email} / {phone} tokens with live links.
function withLinks(text: string) {
  return text.split(/(\{email\}|\{phone\})/).map((p, i) =>
    p === "{email}" ? (
      <a key={i} href={`mailto:${CONTACT.email}`} className="text-gold-700 underline">{CONTACT.email}</a>
    ) : p === "{phone}" ? (
      <a key={i} href={CONTACT.phoneHref} className="text-gold-700 underline">{CONTACT.phone}</a>
    ) : (
      p
    ),
  );
}

function Err({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} data-motion="form-error" className="mt-1.5 flex items-start gap-1.5 text-[13.5px] text-destructive">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function LandingContact({
  t,
  partnerType,
  setPartnerType,
}: {
  t: Copy;
  partnerType: number | null;
  setPartnerType: (i: number | null) => void;
}) {
  const c = t.contact;
  const [vals, setVals] = useState<Omit<Values, "type">>({ name: "", company: "", contact: "", budget: "", msg: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [opened, setOpened] = useState(false);
  const [minH, setMinH] = useState<number>();
  const card = useRef<HTMLDivElement>(null);
  const openedTitle = useRef<HTMLHeadingElement>(null);

  const all: Values = { ...vals, type: partnerType };

  const set = (k: keyof typeof vals) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...vals, [k]: e.target.value };
    setVals(next);
    if (k === "name" || k === "contact") {
      // clear the error as soon as the field is fixed
      if (errors[k] && !check(k, { ...all, ...next })) setErrors((er) => ({ ...er, [k]: undefined }));
    }
  };
  const blur = (k: "name" | "contact") => () => {
    if (check(k, all)) setErrors((er) => ({ ...er, [k]: true }));
  };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const er: Errors = {};
    (["type", "name", "contact"] as const).forEach((k) => {
      if (check(k, all)) er[k] = true;
    });
    setErrors(er);
    const first = er.type ? "c-type-0" : er.name ? "c-name" : er.contact ? "c-contact" : null;
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }

    const typeLabel = c.types[partnerType!];
    const lines = [
      [c.fType, typeLabel],
      [c.fName, vals.name.trim()],
      [c.fCompany, vals.company.trim()],
      [c.fContact, vals.contact.trim()],
      [c.fBudget, vals.budget],
      [c.fMsg, vals.msg.trim()],
    ]
      .filter(([, v]) => v)
      .map(([l, v]) => `${l}: ${v}`);
    const subject = c.mailSubject.replace("{type}", typeLabel);
    setMinH(card.current?.offsetHeight);
    setOpened(true);
    window.location.assign(`mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`);
    setTimeout(() => openedTitle.current?.focus(), 0);
  }

  return (
    <section
      id="contact"
      className="grid scroll-mt-20 items-start gap-x-[clamp(32px,6vw,96px)] gap-y-10 py-18 sm:py-26 lg:grid-cols-2"
    >
      <div className="lg:col-start-1 lg:row-start-1">
        <h2 className="font-heading text-[clamp(38px,4.4vw,60px)] leading-[1.05] font-normal tracking-[-0.01em]">
          {c.title}
        </h2>
        <p className="mt-[22px] max-w-[46ch] text-ink/80">{c.sub}</p>
      </div>

      <div
        ref={card}
        style={opened ? { minHeight: minH } : undefined}
        className="card p-6 shadow-[0_1px_2px_rgb(45_43_43/0.14)] sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1"
      >
        {opened ? (
          <div data-motion="form-state" className="flex flex-col items-start gap-3.5 py-6">
            <Check className="size-8 text-gold" strokeWidth={1.4} aria-hidden />
            <h3 ref={openedTitle} tabIndex={-1} className="font-heading text-[28px] font-semibold outline-none">
              {c.openedTitle}
            </h3>
            <p className="text-ink/80">{withLinks(c.openedBody)}</p>
            <button type="button" className="btn btn-ghost min-h-11" onClick={() => setOpened(false)}>
              {c.back}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate data-motion="form-state">
            <h3 className="font-heading text-[26px] font-semibold">{c.formTitle}</h3>
            <div className="mt-[22px] flex flex-col gap-5">
              <fieldset aria-describedby={errors.type ? "c-type-err" : undefined}>
                <legend className="mb-2 text-[13px] text-ink/70">
                  {c.fType} <span aria-hidden>*</span>
                  <span className="sr-only"> ({c.requiredSr})</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {c.types.map((label, i) => {
                    const on = partnerType === i;
                    return (
                      <label
                        key={label}
                        data-motion="partner-chip-confirm"
                        data-selected={on || undefined}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border px-3.5 text-[14.5px] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-600",
                          on ? "border-gold bg-gold/10 text-gold-700" : "border-ink/50 hover:bg-gold/6",
                        )}
                      >
                        <input
                          id={`c-type-${i}`}
                          type="radio"
                          name="type"
                          checked={on}
                          onChange={() => {
                            setPartnerType(i);
                            setErrors((er) => ({ ...er, type: undefined }));
                          }}
                          className="sr-only"
                        />
                        {on && <Check className="size-3.5" aria-hidden />}
                        {label}
                      </label>
                    );
                  })}
                </div>
                {errors.type && <Err id="c-type-err">{c.errType}</Err>}
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="field">
                  <label htmlFor="c-name">
                    {c.fName} <span aria-hidden>*</span>
                    <span className="sr-only"> ({c.requiredSr})</span>
                  </label>
                  <input
                    id="c-name"
                    name="name"
                    autoComplete="name"
                    className={FIELD}
                    value={vals.name}
                    onChange={set("name")}
                    onBlur={blur("name")}
                    aria-invalid={errors.name || undefined}
                    aria-describedby={errors.name ? "c-name-err" : undefined}
                  />
                  {errors.name && <Err id="c-name-err">{c.errName}</Err>}
                </div>
                <div className="field">
                  <label htmlFor="c-company">
                    {c.fCompany} <span className="text-ink/70">({c.optional})</span>
                  </label>
                  <input
                    id="c-company"
                    name="company"
                    autoComplete="organization"
                    maxLength={120}
                    className={FIELD}
                    value={vals.company}
                    onChange={set("company")}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="c-contact">
                  {c.fContact} <span aria-hidden>*</span>
                  <span className="sr-only"> ({c.requiredSr})</span>
                </label>
                {/* not type=email: this field also takes phone numbers */}
                <input
                  id="c-contact"
                  name="contact"
                  autoComplete="email"
                  inputMode="email"
                  className={FIELD}
                  value={vals.contact}
                  onChange={set("contact")}
                  onBlur={blur("contact")}
                  aria-invalid={errors.contact || undefined}
                  aria-describedby={errors.contact ? "c-contact-err" : undefined}
                />
                {errors.contact && <Err id="c-contact-err">{c.errContact}</Err>}
              </div>

              <div className="field">
                <label htmlFor="c-budget">
                  {c.fBudget} <span className="text-ink/70">({c.optional})</span>
                </label>
                <select id="c-budget" name="budget" className={FIELD} value={vals.budget} onChange={set("budget")}>
                  {c.budgets.map((b, i) => (
                    <option key={i} value={i === 0 ? "" : b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="c-msg">
                  {c.fMsg} <span className="text-ink/70">({c.optional})</span>
                </label>
                <textarea
                  id="c-msg"
                  name="message"
                  rows={4}
                  maxLength={1500}
                  aria-describedby="c-msg-hint"
                  className={cn(FIELD, "min-h-[104px] resize-y py-3")}
                  value={vals.msg}
                  onChange={set("msg")}
                />
                <p id="c-msg-hint" className="mt-1.5 text-[13px] text-ink/70">
                  {c.msgHint}
                </p>
              </div>

              <div>
                <button type="submit" className="btn btn-primary min-h-12 w-full p-3 text-base">
                  {c.send}
                </button>
                <p className="mt-3 text-[13px] text-ink/70">{c.sendNote}</p>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="lg:col-start-1 lg:row-start-2">
      <dl className="border-t border-line">
        <div className={ROW}>
          <dt className={DT}>{c.phoneL}</dt>
          <dd className="font-heading text-2xl tabular-nums">
            <a href={CONTACT.phoneHref} className="inline-flex min-h-12 items-center text-gold-700 hover:text-gold-600">
              {CONTACT.phone}
            </a>
          </dd>
        </div>
        <div className={ROW}>
          <dt className={DT}>{c.emailL}</dt>
          <dd className="font-heading text-2xl break-words">
            <a href={`mailto:${CONTACT.email}`} className="inline-flex min-h-11 max-w-full items-center text-gold-700 [overflow-wrap:anywhere] hover:text-gold-600">
              {CONTACT.email}
            </a>
          </dd>
        </div>
        <div className={ROW}>
          <dt className={DT}>{c.addrL}</dt>
          <dd className="text-base leading-[1.55]">{c.addr}</dd>
        </div>
      </dl>
      {/* fluid instead of the embed's fixed 600×450 so it never overflows on phones */}
      <iframe
        src={CONTACT.mapEmbed}
        title={c.addr}
        className="plate mt-6 aspect-4/3 w-full"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      </div>
    </section>
  );
}
