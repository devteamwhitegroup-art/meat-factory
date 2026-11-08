"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Check, ChevronDown, Minus, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Copy } from "./data";
import { withPhone } from "./landing-faq";
import { SectionHeading } from "./section-heading";

// The only backend call on this site: the ERP's public GraphQL ops
// (publicOrderPackages / createOrder / checkOrderPayment). Prices are
// re-read on the server; the client total is display only.
const API = process.env.NEXT_PUBLIC_API_URL ?? "";

async function gql<T>(field: string, query: string, variables?: object): Promise<T> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  const env = json.data?.[field];
  if (!env?.success) throw new Error(env?.message ?? json.errors?.[0]?.message ?? `HTTP ${res.status}`);
  return env;
}

type Pkg = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  items: { name: string; kg: number | null }[];
  thumbnail: { url: string | null } | null;
  images: { url: string | null }[];
};
type Payment = {
  orderId: string;
  code: string;
  total: number;
  status: string;
  qrImage?: string | null;
  shortUrl?: string | null;
  urls?: { name: string; description: string; logo: string; link: string }[] | null;
};
type Form = { name: string; phone: string; address: string; note: string };
type Errors = Partial<Record<"name" | "phone" | "address", true>>;

const PAYMENT_FIELDS = "success message payment { orderId code total status qrImage shortUrl urls { name description logo link } }";
const money = (n: number) => `${new Intl.NumberFormat("mn-MN").format(n)}₮`;
const kgFmt = (n: number) => new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 1 }).format(n);
const SHOWN = 6;

// Card image first (falls back to the first extra photo), then the extras.
const photos = (p: Pkg) =>
  [p.thumbnail?.url, ...p.images.map((i) => i.url)].filter((u): u is string => !!u);
// Package weight, only when every cut has one.
const kgTotal = (p: Pkg) =>
  p.items.length > 0 && p.items.every((i) => i.kg != null)
    ? p.items.reduce((s, i) => s + (i.kg ?? 0), 0)
    : null;
const FIELD = "input min-h-12 border-ink/50 px-3 text-base hover:border-ink/70";

function Err({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[13.5px] text-destructive">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function LandingOrder({ t, onSelling }: { t: Copy; onSelling: (on: boolean) => void }) {
  const o = t.order;
  const [pkgs, setPkgs] = useState<Pkg[] | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [form, setForm] = useState<Form>({ name: "", phone: "", address: "", note: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [pay, setPay] = useState<Payment | null>(null);
  const [notYet, setNotYet] = useState(false);
  const [detail, setDetail] = useState<Pkg | null>(null);
  const [shot, setShot] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);

  // Native modal: focus trap, Esc and backdrop for free.
  useEffect(() => {
    if (detail) dlg.current?.showModal();
  }, [detail]);
  const openDetail = (p: Pkg) => {
    setShot(0);
    setDetail(p);
  };

  useEffect(() => {
    gql<{ orderPackages: Pkg[] }>(
      "publicOrderPackages",
      "{ publicOrderPackages { success message orderPackages { id name description price items { name kg } thumbnail { url } images { url } } } }",
    )
      .then((r) => {
        setPkgs(r.orderPackages);
        onSelling(r.orderPackages.length > 0);
      })
      .catch(() => setPkgs([])); // can't load = nothing to sell
  }, [onSelling]);

  const paid = pay?.status === "PAID";

  // Poll while the QR is on screen; the server asks QPay on each call.
  useEffect(() => {
    if (!pay || paid) return;
    const id = setInterval(() => check(true), 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay?.orderId, paid]);

  async function check(silent = false) {
    if (!pay) return;
    try {
      const r = await gql<{ payment: Payment }>(
        "checkOrderPayment",
        "mutation($id: ID!) { checkOrderPayment(id: $id) { success message payment { status } } }",
        { id: pay.orderId },
      );
      if (r.payment.status !== "PENDING") setPay((p) => p && { ...p, status: r.payment.status });
      else if (!silent) setNotYet(true);
    } catch {
      if (!silent) setNotYet(true);
    }
  }

  const picked = (pkgs ?? []).filter((p) => qty[p.id] > 0);
  const total = picked.reduce((s, p) => s + p.price * qty[p.id], 0);
  const bump = (id: string, d: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(50, (q[id] ?? 0) + d)) }));
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const er: Errors = {};
    if (form.name.trim().length < 2) er.name = true;
    if (!/^(976)?\d{8}$/.test(form.phone.replace(/\D/g, ""))) er.phone = true;
    if (form.address.trim().length < 5) er.address = true;
    setErrors(er);
    const first = Object.keys(er)[0];
    if (first) return document.getElementById(`o-${first}`)?.focus();
    if (!picked.length) return;

    setBusy(true);
    setApiErr("");
    try {
      const r = await gql<{ payment: Payment }>(
        "createOrder",
        `mutation($customerName: String!, $phone: String!, $address: String!, $note: String, $lines: [OrderLineInput!]!) {
          createOrder(customerName: $customerName, phone: $phone, address: $address, note: $note, lines: $lines) { ${PAYMENT_FIELDS} }
        }`,
        {
          customerName: form.name.trim(),
          phone: form.phone,
          address: form.address.trim(),
          note: form.note.trim() || null,
          lines: picked.map((p) => ({ packageId: p.id, quantity: qty[p.id] })),
        },
      );
      setPay(r.payment);
      setNotYet(false);
    } catch (err) {
      setApiErr(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPay(null);
    setQty({});
    setForm({ name: "", phone: "", address: "", note: "" });
  }

  const phoneAlt = (
    <p className="mt-2 text-ink/80 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">{withPhone(o.phoneAlt)}</p>
  );
  const nPicked = picked.reduce((s, p) => s + qty[p.id], 0);

  const row = (i: Pkg["items"][number], k: number) => (
    <li key={k} className="flex justify-between gap-3 border-b border-line py-1.5">
      <span>{i.name}</span>
      {i.kg != null && (
        <span className="shrink-0 text-ink/70 tabular-nums">
          {i.kg} {o.kg}
        </span>
      )}
    </li>
  );

  const controls = (p: Pkg) => {
    const n = qty[p.id] ?? 0;
    return (
      <div className="mt-auto flex items-center gap-3 pt-2">
        {n > 0 && (
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            aria-label={`${o.less}: ${p.name}`}
            disabled={!!pay}
            onClick={() => bump(p.id, -1)}
          >
            <Minus className="size-4" aria-hidden />
          </button>
        )}
        {n > 0 && (
          <span className="min-w-8 text-center font-heading text-xl tabular-nums" aria-live="polite">
            {n}
          </span>
        )}
        <button
          type="button"
          className={cn(
            "btn btn-primary disabled:cursor-not-allowed disabled:opacity-50",
            n > 0 ? "btn-icon" : "min-h-12 flex-1 text-base",
          )}
          aria-label={`${n > 0 ? o.more : o.select}: ${p.name}`}
          disabled={!!pay}
          onClick={() => bump(p.id, 1)}
        >
          {n > 0 ? <Plus className="size-4" aria-hidden /> : o.select}
        </button>
        {n > 0 && (
          <span className="tag tag-accent">
            <Check className="size-3.5" aria-hidden /> {o.selected}
          </span>
        )}
      </div>
    );
  };

  // ponytail: loading, load error and an empty list all hide the section (and, via onSelling, its nav link + strip)
  if (!pkgs?.length) return null;

  return (
    <section id="order" className="scroll-mt-20 py-18 sm:py-26">
      <div className="grid items-start gap-x-[clamp(32px,6vw,96px)] gap-y-8 lg:grid-cols-[3fr_2fr]">
        <div>
          <SectionHeading title={o.title} />
          <p className="mt-[22px] max-w-[60ch] text-ink/80">{o.sub}</p>
          <dl className="mt-8 grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
            {o.facts.map(([label, value]) => (
              <div key={label} className="border-b border-line py-3">
                <dt className="text-[13px] text-ink/70">{label}</dt>
                <dd className="mt-0.5 text-base font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="plate relative hidden aspect-[4/3] lg:block">
          <Image
            src="/photos/storage.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 0px"
            className="object-cover object-[center_30%]"
          />
        </div>
      </div>

        <>
          <div className="mt-10">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pkgs.map((p) => {
                const n = qty[p.id] ?? 0;
                const kg = kgTotal(p);
                const cover = photos(p)[0];
                return (
                  <article
                    key={p.id}
                    className={cn(
                      "card gap-4 p-6",
                      n > 0 && "border-gold-600 shadow-[inset_0_0_0_1px_var(--gold-600)]",
                    )}
                  >
                    {cover && (
                      <button
                        type="button"
                        aria-label={`${o.details}: ${p.name}`}
                        onClick={() => openDetail(p)}
                        className="relative -mx-6 -mt-6 aspect-[4/3] overflow-hidden rounded-t-[3px]"
                      >
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                        />
                      </button>
                    )}
                    <div>
                      <h3 className="font-heading text-[24px] leading-tight font-semibold">{p.name}</h3>
                      <p className="mt-1 font-heading text-[30px] leading-tight text-ink tabular-nums">{money(p.price)}</p>
                      {kg != null && (
                        <p className="mt-1 text-[15px] text-ink/70">{o.totalKg.replace("{kg}", kgFmt(kg))}</p>
                      )}
                    </div>
                    {/* Clamped so a long description can't stretch the row; full text in the dialog. */}
                    {p.description && <p className="line-clamp-3 text-[15px] text-ink/80">{p.description}</p>}
                    <button
                      type="button"
                      className="btn btn-ghost -my-2 min-h-11 self-start"
                      onClick={() => openDetail(p)}
                    >
                      {o.details} →
                    </button>
                    {p.items.length > 0 && (
                      <div className="text-[15px]">
                        <ul>{p.items.slice(0, SHOWN).map(row)}</ul>
                        {p.items.length > SHOWN && (
                          <details data-motion="faq-item" className="group">
                            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-gold-700 marker:hidden [&::-webkit-details-marker]:hidden">
                              {o.moreItems.replace("{n}", String(p.items.length - SHOWN))}
                              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                            </summary>
                            <ul>{p.items.slice(SHOWN).map(row)}</ul>
                          </details>
                        )}
                      </div>
                    )}
                    {controls(p)}
                  </article>
                );
              })}
            </div>

            {picked.length > 0 && !pay && (
              <div
                data-motion="order-bar"
                className="sticky bottom-0 z-10 mt-5 flex min-h-14 items-center justify-between gap-4 bg-ink px-4 py-2 text-paper"
              >
                <span className="tabular-nums">
                  {o.barCount.replace("{n}", String(nPicked))} · {money(total)}
                </span>
                <a href="#order-form" className="btn btn-primary min-h-11 border-gold-300 px-4 text-gold-300">
                  {o.barCta} ↓
                </a>
              </div>
            )}
          </div>

          <div
            id="order-form"
            tabIndex={-1}
            data-motion="form-state"
            className="card mt-8 scroll-mt-20 p-6 shadow-[0_1px_2px_rgb(45_43_43/0.14)] sm:p-8"
          >
            {paid ? (
              <div className="flex flex-col items-start gap-3.5 py-4">
                <Check className="size-8 text-gold" strokeWidth={1.4} aria-hidden />
                <h3 className="font-heading text-[28px] font-semibold">{o.paidTitle}</h3>
                <p className="text-ink/80">
                  {o.paidBody.replace("{code}", pay.code).replace("{phone}", form.phone)}
                </p>
                <button type="button" className="btn btn-ghost min-h-11" onClick={reset}>
                  {o.again}
                </button>
              </div>
            ) : pay ? (
              <div className="grid items-start gap-8 md:grid-cols-[260px_1fr]">
                {pay.qrImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- base64 data URI from QPay
                  <img
                    src={`data:image/png;base64,${pay.qrImage}`}
                    alt={`QPay QR — ${money(pay.total)}`}
                    className="plate aspect-square w-full max-w-[260px] bg-white max-md:order-last max-md:max-w-[200px]"
                  />
                )}
                <div>
                  <h3 className="font-heading text-[26px] font-semibold">{o.payTitle}</h3>
                  <p className="mt-2 text-ink/80">{o.payBody}</p>
                  <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[15px]">
                    <dt className="text-ink/70">{o.orderNo}</dt>
                    <dd className="tabular-nums">{pay.code}</dd>
                    <dt className="text-ink/70">{o.total}</dt>
                    <dd className="font-heading text-xl text-gold-700 tabular-nums">{money(pay.total)}</dd>
                  </dl>
                  {!!pay.urls?.length && (
                    <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:hidden">
                      {pay.urls.map((u) => (
                        <li key={u.name}>
                          <a
                            href={u.link}
                            className="flex min-h-11 flex-col items-center gap-1 rounded-md border border-line p-2 text-center text-[12px]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- remote bank logo from QPay */}
                            <img src={u.logo} alt="" className="size-10 rounded-md" />
                            {u.description}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-5 text-[14px] text-ink/70" aria-live="polite">
                    {notYet ? o.notYet : o.waiting}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" className="btn btn-primary min-h-11" onClick={() => check()}>
                      {o.check}
                    </button>
                    <button type="button" className="btn btn-ghost min-h-11" onClick={() => setPay(null)}>
                      {o.back}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-heading text-[26px] font-semibold">{o.summary}</h3>
                  {picked.length === 0 ? (
                    <p className="mt-4 text-ink/70">{o.pickFirst}</p>
                  ) : (
                    <ul className="mt-4 text-[15px]">
                      {picked.map((p) => (
                        <li key={p.id} className="flex justify-between gap-3 border-b border-line py-2">
                          <span>
                            {qty[p.id]} × {p.name}
                          </span>
                          <span className="tabular-nums">{money(p.price * qty[p.id])}</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-3 pt-3 font-heading text-xl">
                        <span>{o.total}</span>
                        <span className="text-gold-700 tabular-nums">{money(total)}</span>
                      </li>
                    </ul>
                  )}
                </div>

                <div className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="field">
                      <label htmlFor="o-name">{o.fName} *</label>
                      <input
                        id="o-name"
                        autoComplete="name"
                        maxLength={100}
                        className={FIELD}
                        value={form.name}
                        onChange={set("name")}
                        aria-invalid={errors.name || undefined}
                        aria-describedby={errors.name ? "o-name-err" : undefined}
                      />
                      {errors.name && <Err id="o-name-err">{o.errName}</Err>}
                    </div>
                    <div className="field">
                      <label htmlFor="o-phone">{o.fPhone} *</label>
                      <input
                        id="o-phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        maxLength={16}
                        className={FIELD}
                        value={form.phone}
                        onChange={set("phone")}
                        aria-invalid={errors.phone || undefined}
                        aria-describedby={errors.phone ? "o-phone-err" : undefined}
                      />
                      {errors.phone && <Err id="o-phone-err">{o.errPhone}</Err>}
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="o-address">{o.fAddress} *</label>
                    <textarea
                      id="o-address"
                      rows={2}
                      maxLength={500}
                      placeholder={o.addressHint}
                      autoComplete="street-address"
                      className={cn(FIELD, "resize-y py-3")}
                      value={form.address}
                      onChange={set("address")}
                      aria-invalid={errors.address || undefined}
                      aria-describedby={errors.address ? "o-address-err" : undefined}
                    />
                    {errors.address && <Err id="o-address-err">{o.errAddress}</Err>}
                  </div>
                  <div className="field">
                    <label htmlFor="o-note">
                      {o.fNote} <span className="text-ink/70">({o.optional})</span>
                    </label>
                    <input id="o-note" maxLength={1000} className={FIELD} value={form.note} onChange={set("note")} />
                  </div>
                  {apiErr && (
                    <div>
                      <Err id="o-api-err">{apiErr}</Err>
                      {phoneAlt}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={busy || picked.length === 0}
                    className="btn btn-primary min-h-12 w-full p-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? o.submitting : `${o.submit}${total ? ` · ${money(total)}` : ""}`}
                  </button>
                  {o.privacy && <p className="text-[13px] text-ink/70">{o.privacy}</p>}
                </div>
              </form>
            )}
          </div>

          {o.qa.some((x) => x.a) && (
            <div className="mt-8 border-t border-line">
              {o.qa
                .filter((x) => x.a)
                .map((it) => (
                  <details key={it.q} data-motion="faq-item" className="group border-b border-line">
                    <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-4 py-4 marker:hidden hover:text-gold-700 [&::-webkit-details-marker]:hidden">
                      <span className="font-heading text-[22px] leading-[1.25] font-semibold">{it.q}</span>
                      <Plus aria-hidden className="mt-1 size-[18px] shrink-0 transition-transform group-open:rotate-45" strokeWidth={1.6} />
                    </summary>
                    <p className="max-w-[62ch] pb-5 text-[15.5px] text-ink/80">{withPhone(it.a)}</p>
                  </details>
                ))}
            </div>
          )}
        </>

      <dialog
        ref={dlg}
        aria-labelledby="pkg-detail-title"
        onClose={() => setDetail(null)}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto max-h-[calc(100dvh-32px)] w-[min(960px,calc(100vw-32px))] overflow-y-auto overscroll-contain rounded-[4px] border border-line bg-paper p-0 text-ink backdrop:bg-ink/60"
      >
        {detail && (
          <div className="relative grid gap-6 p-5 sm:p-8 md:grid-cols-2">
            <button
              type="button"
              aria-label={o.close}
              onClick={() => dlg.current?.close()}
              className="btn btn-secondary btn-icon absolute top-3 right-3 z-10 bg-paper"
            >
              <X className="size-5" aria-hidden />
            </button>
            {photos(detail).length > 0 && (
              <div>
                <div className="plate relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={photos(detail)[shot] ?? photos(detail)[0]}
                    alt={detail.name}
                    fill
                    sizes="(min-width: 768px) 460px, 100vw"
                    className="object-cover"
                  />
                </div>
                {photos(detail).length > 1 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {photos(detail).map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        aria-label={o.photo.replace("{n}", String(i + 1))}
                        aria-pressed={i === shot}
                        onClick={() => setShot(i)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-[3px] border",
                          i === shot ? "border-gold-600 shadow-[inset_0_0_0_1px_var(--gold-600)]" : "border-line opacity-80 hover:opacity-100",
                        )}
                      >
                        <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col gap-4">
              <div className="pr-12">
                <h3 id="pkg-detail-title" className="font-heading text-[28px] leading-tight font-semibold">
                  {detail.name}
                </h3>
                <p className="mt-1 font-heading text-[30px] leading-tight tabular-nums">{money(detail.price)}</p>
                {kgTotal(detail) != null && (
                  <p className="mt-1 text-[15px] text-ink/70">
                    {o.totalKg.replace("{kg}", kgFmt(kgTotal(detail)!))}
                  </p>
                )}
              </div>
              {detail.description && (
                <p className="text-[15.5px] whitespace-pre-line text-ink/80">{detail.description}</p>
              )}
              {detail.items.length > 0 && <ul className="text-[15px]">{detail.items.map(row)}</ul>}
              {controls(detail)}
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
