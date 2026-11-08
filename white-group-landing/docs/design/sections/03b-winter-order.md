# 03b Winter meat order (`#order`), new spec in Revision 2

**Why a new spec:** another session added `src/components/landing/landing-order.tsx` with no design doc. It now takes real money, so it needs states, copy and acceptance criteria like every other section.

**Hard constraints, do not change:**
- `gql()`, the `publicOrderPackages` fetch effect, `submit()` → `createOrder`, `check()` → `checkOrderPayment`, the 4 s polling and `reset()` stay byte-for-byte as they are.
- Packages, names, descriptions, items and prices come **only** from the API. Nothing package-related goes into `data.ts`.
- Everything below is presentation: markup, classes, static copy, and display-only values derived from data already fetched.

## Purpose
Let a household buy a winter meat package in under two minutes on a phone. Show where the meat came from right next to the price, because that is the one thing competitors can't show (`competitors.md` §4).

## Placement
- **Move the section to directly after 03 Business model explorer.** Today it sits between 02 and 03.
  - *Reason:* competitors show a price with no provenance. Our explorer is the provenance proof, so the price should follow it.
  - It also keeps an investor's first two screens (hero, numbers) uninterrupted.
- Retail visitors still get there in one tap through three routes: the seasonal strip above the hero (see 01), the nav item "Захиалга", and the sticky header.
- New page order: Hero → Numbers → **Model → Order** → Market → Roadmap → Partnership → Team → FAQ → Contact → Footer.

## Content fields
| Source | Field | Notes |
|---|---|---|
| API (unchanged) | `pkg.name`, `pkg.price`, `pkg.description`, `pkg.items[{name,kg}]` | rendered as-is |
| Derived (display only) | `totalKg = sum(items.kg)` | **only when every item has a non-null kg** and there is ≥1 item. Format with the same `Intl` locale as `money()`, max 1 decimal |
| `data.ts` → `order` (existing) | `title`, `sub`, `loading`, `empty`, `loadErr`, `less`, `more`, `kg`, `summary`, `pickFirst`, `total`, `f*`, `err*`, `submit*`, `pay*`, `orderNo`, `waiting`, `check`, `notYet`, `paid*`, `again`, `back`, `addressHint`, `optional` | keep |
| `data.ts` → `order.kicker` | — | **delete** (and stop passing it to `SectionHeading`). The tokens kicker rule allows kickers only in hero, explorer and founder |
| `data.ts` → `order` (new) | `strip`, `facts`, `totalKg`, `select`, `selected`, `moreItems`, `barCount`, `barCta`, `phoneAlt`, `privacy`, `qa[]` | see Copy |
| `CONTACT` | `phone`, `phoneHref` | phone fallback |
| Photo | `/photos/storage.jpg` | desktop only, natural with no filter, `alt=""` (decorative). Placeholder until the owner sends a photo of a packed package (TODO 22) |

## Copy (new keys; existing keys unchanged)
| Key | mn | en |
|---|---|---|
| strip | Өвлийн идэшний захиалга нээлттэй — багц, үнийг үзэх | Winter meat orders are open — see packages and prices |
| facts[0] | Гарал үүсэл → Дорнод, Сүхбаатарын малчдаас шууд | Origin → Straight from herders in Dornod and Sükhbaatar |
| facts[1] | Боловсруулалт → Өөрийн үйлдвэрт · HALAL, HACCP, ISO 9001 | Processing → In our own plant · HALAL, HACCP, ISO 9001 |
| facts[2] | Хүргэлт → [PLACEHOLDER: бүс, хугацаа, үнэ] | Delivery → [PLACEHOLDER: area, timing, fee] |
| facts[3] | Төлбөр → QPay, банкны аппаараа | Payment → QPay, from your bank app |
| totalKg | Нийт {kg} кг | {kg} kg in total |
| select | Сонгох | Select |
| selected | Сонгосон | Selected |
| moreItems | Бусад {n} зүйл | {n} more items |
| barCount | Багц: {n} | Packages: {n} |
| barCta | Захиалах | Checkout |
| phoneAlt | Утсаар захиалах: {phone} | Order by phone: {phone} |
| privacy | Таны нэр, утас, хаягийг зөвхөн энэ захиалгыг хүргэхэд ашиглана. | We use your name, phone and address only to deliver this order. |
| qa[0].q | Хүргэлт хэзээ, хаана хийгдэх вэ? | When and where do you deliver? |
| qa[0].a | [PLACEHOLDER: хүргэлтийн бүс, хугацаа, төлбөр]. Төлбөр орсны дараа хүргэлтийн цагаа тохирохоор бид тантай утсаар холбогдоно. | [PLACEHOLDER: delivery area, timing and fee]. Once payment arrives we call you to arrange the delivery time. |
| qa[1].q | Захиалгаа цуцалж, төлбөрөө буцааж авч болох уу? | Can I cancel and get a refund? |
| qa[1].a | [PLACEHOLDER] | [PLACEHOLDER] |

Notes:
- `facts` uses the same `[label, value][]` shape as `Stop.facts`.
- `{phone}` is replaced with a live `tel:` link via `withPhone`, exported from `landing-faq.tsx`.
- `qa[0].a`'s second sentence restates `paidBody`, which is a fact of the current flow.
- `privacy` is a promise, so the owner must confirm it (TODO 23).
- `strip = ""` hides the strip (season closed, TODO 20).

## Layout
**Section head (paper):** two columns at ≥1024px.
- Left: h2 `title`, `sub` (max 60ch), then the facts as a hairline `<dl>` grid, 2×2. It uses the Key numbers grid language: `border-t border-line`, cells `border-b`, label 13px ink/70, value 16px ink 600.
- Right: a `.plate` 4:3 with `storage.jpg` (`object-position: center 30%`).
- Below 1024px the photo is **not rendered** (`hidden lg:block`), so phones reach the packages faster.

**Package grid:** keep `sm:grid-cols-2 lg:grid-cols-3`. Each card is an `<article class="card">`, top to bottom:
1. Name: h3, 24px, 600.
2. **Price**, using the new `price` type token: 30px, ink, `tabular-nums`. It is now the largest text on the card. *Reason: price and weight decide the purchase. Today the 22px price is smaller than the 24px name.*
3. `totalKg`, 15px ink/70, only when computable.
4. Description, 15px ink/80, if present.
5. Items list: hairline rows, name left, kg right. The kg span gets `shrink-0` so it never wraps under the name.
   - **Show the first 6 lines.** If there are more, a native `<details>` with summary `moreItems` (`{n}` = hidden count, min-h 44px, chevron) holds the rest.
   - *Reason: Primeat's идэш has 16 lines. Three such cards would be roughly 3 phone screens before the form.*
6. Control row pinned to the bottom with `mt-auto`, described under Interaction.

**Sticky summary bar:**
- Rendered only when `picked.length > 0 && !pay`. It is the **last child of the wrapper that holds the grid**, with `position: sticky; bottom: 0`. Pure CSS, no JS: it pins to the viewport bottom while the user browses packages, and settles just above the form card once they reach it.
- `bg-ink text-paper`, min-h 56px, container width, `z-10` (below the header's z-50).
- Left: `barCount` · `money(total)` (tabular). Right: `<a href="#order-form" class="btn btn-primary min-h-11 border-gold-300 text-gold-300">{barCta} ↓</a>`.
- *Reason:* on a phone the form sits below every card. Competitors solve this with a cart; we have no cart, so we keep the total visible and one tap from checkout.

**Summary + form card:** the existing card gets `id="order-form" scroll-mt-20 tabIndex={-1}`, so following the bar link both scrolls to the card and moves focus to it. Add `privacy` (13px ink/70) under the submit button.

**Below the card:** `qa[]` as native `<details>` rows, using the FAQ row markup from 08 (22px question, `Plus` icon, hairlines). Omit any item whose answer is still empty at launch (launch gate).

## Interaction and states
| Element | Spec |
|---|---|
| **Add control, qty 0** | One full-width `.btn .btn-primary min-h-12` labelled `select` ("Сонгох"), `aria-label="{select}: {name}"`. Click calls the existing `bump(id, +1)`. |
| **Add control, qty ≥ 1** | `[−]  n  [+]` (existing 44px icon buttons) plus a `.tag .tag-accent` with ✓ `selected`. **The "Сонгох" button and the "+" button are the same element** (same key): its content swaps from text to the `Plus` icon, so keyboard focus is not lost. `−` and the count render only when n > 0. The count keeps `aria-live="polite"`. |
| Card selected | 2px gold-600 edge with no layout shift: `border-gold-600` + `shadow-[inset_0_0_0_1px_var(--gold-600)]`. Replaces `border-gold bg-gold/5`. Gold-600 is 3.3:1 on paper (non-text ≥3:1). The ✓ tag means selection is not shown by colour alone. |
| Card hover | none (the card is not a link) |
| Focus | global gold-600 outline on every button, summary, link and the form card |
| Disabled (pay in progress) | existing `disabled={!!pay}`, opacity 50%, `cursor-not-allowed` |
| **Loading** | Prerendered: the head, facts and form card shell are all in the HTML. The package area shows `loading` in a `min-h-[240px]` box with a `border border-dashed border-line` frame, so the page below moves less when packages arrive. |
| **Load error** | `loadErr`, then a new line with `phoneAlt` (tel: link, min-h 44px). *Reason: Primeat's client-only catalogue shows nothing when JS or the network fails. Ours must leave a way to buy.* |
| **Empty** (0 packages) | `empty` + `phoneAlt`. The owner also clears `order.strip`. |
| **API error on submit** | Keep showing the server message (the ERP returns Mongolian, user-facing text). Under it, always add `phoneAlt`. Do not touch the `catch`. *Reason: a network failure surfaces "Failed to fetch" in English; the phone line gives the visitor a way out. Easy Meat shows how bad raw developer output looks.* |
| Submitting | existing `submitting` label, button disabled |
| **Pay state, <768px** | CSS only: add `max-md:order-last max-md:max-w-[200px]` to the QR `<img>`. The QR then drops below the details column, giving this order: title → body → order no. / total → **bank app grid** → waiting text → buttons → **QR**. *Reason: a phone can't scan its own screen, yet today the QR fills the first screen and pushes the bank deep links below the fold. The QR stays available for scanning from a second device.* |
| Pay state, ≥768px | unchanged (QR left, details right; bank grid stays `md:hidden`) |
| Paid | unchanged |
| Language switch | API content stays in its source language. Every static string switches. Form values persist (existing). |

Keyboard order: the cards in API order, then the bar link, then the form card.

## Data source
- Packages: ERP GraphQL via `NEXT_PUBLIC_API_URL` (existing, unchanged).
- Everything else: static, from `data.ts` → `order`, `CONTACT`.

## Motion notes
- The sticky bar enters with a short rise and fade the first time a package is selected, and leaves the same way when the last one is removed. No bounce.
- The selected edge appears without animation. The count changes without counting.
- The "more items" disclosure reuses the FAQ height reveal.
- The swap between form, pay and paid is a short crossfade in place (reuse `form-state`).
- **The seasonal strip never moves.** No marquee, no ticker (Primeat; WCAG 2.2.2).
- No confetti or celebration on paid. The check icon is static.
- Reduced motion: everything is instant.

## Acceptance
- [ ] `git diff` of `landing-order.tsx` shows no change inside `gql`, the fetch `useEffect`, `submit`, `check`, the polling effect or `reset`.
- [ ] No package name, price or item appears in `data.ts`.
- [ ] Section sits after `#model` in `page.tsx`, and nav order matches page order.
- [ ] `totalKg` shows only when every item has kg; with any null it is hidden, never "0 кг".
- [ ] Prices render as `879,000₮` style (comma thousands, ₮ suffix, no space). If `Intl` "mn-MN" yields a different separator, switch the formatter locale, not the data.
- [ ] Pressing "Сонгох" with the keyboard leaves focus on the same control, now "+".
- [ ] A card with 16 items shows 6, plus "Бусад 10 зүйл" (MN) / "10 more items" (EN).
- [ ] At 390px MN: no horizontal scroll, long item names wrap with kg right-aligned, the sticky bar never covers the submit button, all targets ≥44px.
- [ ] On a 390px viewport in the pay state, the bank grid comes before the QR.
- [ ] Load error and empty states both show a working `tel:` link.
- [ ] Head, facts and phone fallback are present in the prerendered HTML (`pnpm build`, inspect `/`).
- [ ] No image filter anywhere. `grep -rn "sepia\|grayscale\|saturate(" src` finds nothing.
