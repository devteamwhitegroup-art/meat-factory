# Handoff: investor & partner landing page

## Revision 2 (2026-11-08): competitor-driven changes

Read with `competitors.md` (the evidence), `tokens.md` (Rev 2 block), `wireframe.md` (Rev 2 block), `sections/01`, `02`, `03`, **`03b` (new)**, `05` and `07`.

**Owner rules that must hold:**
- Source Serif 4 for everything.
- Paper `#e6e0d4`; never near-white.
- Photos natural, with no filters.
- No visible scrollbars on horizontal rails.

**Order section constraint:** in `landing-order.tsx`, do not touch `gql`, the `publicOrderPackages` effect, `submit`/`createOrder`, `check`/`checkOrderPayment`, the polling effect or `reset`. Packages and prices come only from the API.

### Prioritised change list (smallest high-impact first)
| # | File | Change | Why |
|---|---|---|---|
| 1 | `landing-order.tsx` | Pay state: QR `<img>` gets `max-md:order-last max-md:max-w-[200px]`, so on phones the bank-app grid comes first | On a phone the bank deep links are the only way to pay, and today they sit below a QR the same phone can't scan |
| 2 | `data.ts` | `numbers.items[0].n` = `String(new Date().getFullYear() - 2008)` in `mn` and `en` | "17 years" is wrong in 2026; investors check dates |
| 3 | `landing-model.tsx` | Stop-rail wrapper (`relative snap-x overflow-x-auto pb-1`): add `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` | Owner rule; this is the one rail still showing a scrollbar |
| 4 | `landing-model.tsx` | Specs table: remove `min-w-[460px]` and the `overflow-x-auto` wrapper; cells wrap; `max-sm:text-[14px]` | Owner rule; a table with a hidden scrollbar would hide cut-off columns, so it must fit instead |
| 5 | `landing-team.tsx`, `landing-roadmap.tsx` | `text-gold` → `text-gold-700` on cert names and the roadmap detail year. Planned year: `text-gold-700 italic`, no `/60` | Recomputed on `#e6e0d4`, gold text is 2.6:1 and fails even the 3:1 large-text floor |
| 6 | `page.tsx`, `data.ts` | Move `<LandingOrder>` to right after `<LandingModel>`: `Numbers` alone in the first container, then `Model`, then a container with `Order`, `<hr>`, `Market`, `<hr>`, `Roadmap`. Move the `#order` nav item after `#model` (mn + en) | Competitors put price before provenance; ours follows the explorer that proves provenance. Investor screens 1–2 stay uninterrupted |
| 7 | `layout.tsx`, `globals.css` | `export const viewport = { themeColor: "#e6e0d4" }`; `:root { color-scheme: light }`; `.input:autofill` paper inset rule; `.input option` paper background (tokens, Glare) | The owner's glare complaint. These are the white areas the browser still paints |
| 8 | `landing-hero.tsx`, `data.ts` | Restore `hero.ctaDeck` ("Хөрөнгө оруулагчийн танилцуулга хүсэх" / "Request the investor deck") as a secondary button. Clicking calls `onPick(0)`, then focuses `#c-name` after 700 ms, as in partnership | The brief's investor CTA is missing from the first screen |
| 9 | `landing-order.tsx`, `data.ts`, `landing-faq.tsx` | Load error, empty and submit error each get an `order.phoneAlt` line with a `tel:` link. Export `withPhone` from `landing-faq.tsx` and reuse it. The loading box gets `min-h-[240px] border border-dashed border-line` | Primeat's client-only catalogue shows nothing when it fails. Raw "Failed to fetch" must never be the last word |
| 10 | `landing-order.tsx`, `data.ts` | Package card (03b): price token 30px ink; `totalKg` when every item has kg; first 6 items, then `<details>` "Бусад {n} зүйл"; kg `shrink-0`; one button that reads "Сонгох" at 0 and becomes "+" (same element, keeps focus), with `−`/count only when n > 0; selected = `border-gold-600` + inset 1px shadow + ✓ `selected` tag | Competitor bundles anchor on price and weight. Primeat's идэш has 16 lines. A bare `[−] 0 [+]` doesn't invite a choice |
| 11 | `landing-order.tsx`, `data.ts` | Section head: delete `order.kicker`. Add the `order.facts` 2×2 hairline `<dl>` and, at `lg+` only, a `.plate` with `/photos/storage.jpg` (natural) | Puts our differentiator (named origin, own plant, HALAL/HACCP/ISO) and the delivery terms right where the price is. Neither competitor can |
| 12 | `landing-order.tsx`, `data.ts` | Sticky summary bar: last child of the grid wrapper, `sticky bottom-0 z-10 bg-ink text-paper min-h-14`, shown when `picked.length && !pay`, with `barCount` · total and a `barCta` link to `#order-form`. Add `id="order-form" scroll-mt-20 tabIndex={-1}` to the form card | There is no cart, and on a phone the form sits below every card |
| 13 | `page.tsx`, `data.ts` | Seasonal strip inside `<main>`, before the hero: `{t.order.strip && <a href="#order" …>}` on `bg-surface`, min-h 44px, not sticky, never animated. Split the text on " — " and set the second half in gold-700 with an underline | Retail visitors need a one-tap path now that the order section sits lower. This borrows Primeat's banner without its ticker |
| 14 | `landing-order.tsx`, `data.ts` | `order.privacy` (13px ink/70) under the submit button; `order.qa[]` as `<details>` rows below the card, using the FAQ row markup | Competitors publish delivery, refund and privacy terms; we take payment with none |
| 15 | `section-heading.tsx`, `landing-hero.tsx` | Remove `uppercase` from `Kicker` and the hero kicker; tracking ≤0.08em | v1 type rule: uppercase Cyrillic runs about 30% wider. *Skip if the client's Classical system requires caps* |
| 16 | `layout.tsx` (verify only) | Check ₮ renders in Source Serif 4 (DevTools → Rendered Fonts). If not, add `"latin-ext"` to `subsets` | Prices are now on the page; on Google Fonts ₮ is in the `latin-ext` subset |

### New `data.ts` keys (both `mn` and `en`; copy is in `sections/01` and `03b`)
- `hero.ctaDeck`
- `order.strip`, `order.facts`, `order.totalKg`, `order.select`, `order.selected`, `order.moreItems`, `order.barCount`, `order.barCta`, `order.phoneAlt`, `order.privacy`, `order.qa`
- **Remove:** `order.kicker`.

This adds **6** `[PLACEHOLDER]` hits: `facts[2]`, `qa[0].a` and `qa[1].a`, in each language. All three come from brief TODO 18–19 and are covered by the launch gate.

### Components
- **New files:** none. Every change lives in the existing files listed above.
- **Reused:** `SectionHeading` (with no kicker), `.card`, `.btn`, `.tag`, `.plate`, `withPhone` (now exported from `landing-faq.tsx`), the FAQ `<details>` row markup, `money()`, `centerInRail`.
- **Dependencies:** none added.

### Motion hooks (for the motion-engineer)
- `order-bar`: the sticky bar enters and leaves with a short rise and fade.
- Reuse `form-state` for the form, pay and paid swaps.
- Reuse the `faq-item` height reveal on the items disclosure and the order Q&A.
- The seasonal strip must stay static.

### Verify
- `pnpm lint` and `pnpm build`; `/` must still be `○ Static`.
- In the prerendered HTML, check that the order head, facts and phone fallback are present.
- 390px and 1280px in **MN**: no horizontal page scroll and no visible scrollbars on rails.
- A keyboard pass through the order flow: "Сонгох" keeps focus; the bar link lands on the form.
- Review `git diff src/components/landing/landing-order.tsx`: no lines changed inside the protected functions.

### Open questions
- **Owner:** brief TODO 18–25 (delivery, refunds, season dates, ₮/kg, package photo, privacy line, ERP package naming, pay-later).
- **Design defaults (change them if you disagree):**
  - The order sits after the explorer. If the owner wants it right after the hero during the season, move it back; everything else in 03b still applies.
  - ₮/kg is hidden until the owner agrees (TODO 21).
  - `storage.jpg` stands in for a package photo. It also appears at explorer stop 6, which is not the default stop.
  - The order photo is hidden below 1024px so phones reach the packages faster.
  - The order Q&A lives in 03b, not in the FAQ (08), so the investor FAQ stays focused.

---

## v1 handoff (implemented; kept unchanged for reference)

Read with `brief.md`, `tokens.md`, `wireframe.md` and `sections/01–10`.

## 0. Project constraints (these override the generic wording in `implementer.md` / `motion-engineer.md`)
| Generic rule says | This repo does |
|---|---|
| "strings in `locales/mn.json` / `en.json`" | **All copy lives in `src/components/landing/data.ts`** (`const mn`, `const en: Copy`). `en` must match `mn`'s shape exactly, so every new key goes in both. |
| "numbers, partners, roadmap, FAQ in `content/*.json` or a CMS" | Same file, `data.ts`. Non-translated constants (`CONTACT`, `CERTS`, `VIDEOS`, `STEP_MEDIA`, `MAP_NODES`) stay as top-level `export const`s there. |
| "toggle persists via `/en` route or query param; hreflang" | **No `/en` route and no hreflang.** The single static route is `/`. The MN/EN toggle is client state in `src/app/page.tsx`, which already sets `<html lang>`. Metadata stays Mongolian (`layout.tsx`). Optional: persist the choice in `localStorage`, wrapped in try/catch, and read it in an effect after hydration so prerendered MN HTML stays intact. |
| "server validation, minimal endpoint, honeypot, rate limit" | **No backend.** The default delivery is a `mailto:` prefill to `info@whitegroup.mn`; see section 09. Client validation only. Honeypot and rate limit are not applicable until a server or form service exists (TODO(owner) 14). |
| "add i18n framework / UI library" | Don't. Stack: Next.js 16 App Router, Tailwind v4, **Base UI (`@base-ui/react`), not Radix** (no `asChild`; use `render` / `className`), lucide. Nothing new to install. |
| Motion library | None installed. Use **CSS + IntersectionObserver**. |
| Package manager | **pnpm**. Dev server on **:3001**. Verify with `pnpm lint` and `pnpm build` (the build must still prerender `/` as static). |

Images: keep `next/image` (it already serves responsive WebP with `sizes`). Real photos are in `public/photos/` (2400px). Resize any new photo before adding it, because originals are 12 MB.

## 1. Build order
The conversion path comes first, so the page is useful at every step.
1. **`data.ts` restructure.** Add the new keys, move the existing ones (see §4) and keep both languages compiling. Fix the globals listed in §5.
2. **Header + 01 Hero.** Covers nav, CTAs, removing stats and cert tags.
3. **09 Inquiry form + partner-type lift in `page.tsx`.** Every CTA depends on it.
4. **06 Partnership options.**
5. **02 Key numbers.**
6. **03 Business model explorer.** This is the largest piece. It absorbs About, Process, Capacity and Products.
7. **05 Roadmap.** Extends the timeline.
8. **07 Team & trust.** Absorbs Founder, Standards and Partners.
9. **08 FAQ.**
10. **04 Market.** Build it last because it is the most placeholder-heavy and may be dropped.
11. **10 Footer.**
12. Delete the absorbed components, run `pnpm lint` and `pnpm build`, and run the launch gate (§7).

## 2. Components (`src/components/landing/`)
| File | Action |
|---|---|
| `landing-header.tsx` | **Modify.** New nav. Inline nav only at `xl` (≥1280); below that, the Sheet. Language toggle and icon button ≥44px |
| `landing-hero.tsx` | **Modify.** Remove the stats grid; two CTAs; cert tags. Keep `playMuted` export |
| `landing-numbers.tsx` | **New** (02) |
| `landing-model.tsx` | **New** (03). Uses Base UI `Tabs`. Move the map SVG + nodes in from `landing-about.tsx` and the media/gate logic in from `landing-process.tsx`. The capacity table goes inside `<details>` |
| `landing-market.tsx` | **New** (04) |
| `landing-roadmap.tsx` | **Rename and extend** `landing-timeline.tsx` (05). Swap the `aria-pressed` buttons for Base UI `Tabs`; add planned items and the Today marker |
| `landing-partnership.tsx` | **New** (06) |
| `landing-team.tsx` | **New** (07). Renders the existing `LandingFounder`, then people, certs, partners and jobs (the markup comes from `landing-standards.tsx` + `landing-partners.tsx`) |
| `landing-founder.tsx` | **Reuse** unchanged (rendered inside team) |
| `landing-faq.tsx` | **New** (08). Native `<details name="faq">` |
| `landing-contact.tsx` | **Rewrite** the form (09). Keep file name and `id="contact"` |
| `landing-footer.tsx` | **Modify.** Contact column, regNo |
| `section-heading.tsx` | **Modify.** `kicker` becomes optional (tokens: kicker rule) |
| `landing-about.tsx`, `landing-process.tsx`, `landing-capacity.tsx`, `landing-products.tsx`, `landing-standards.tsx`, `landing-partners.tsx`, `landing-timeline.tsx` | **Delete** after their content is moved (§4) |
| `ui/sheet.tsx`, `ui/button.tsx` | Reuse as-is |

No shared "card" or "stat" primitive is needed. Each pattern appears once or twice, so inline the classes. ponytail: extract only if a third use appears.

### `page.tsx` wiring
```tsx
const [partnerType, setPartnerType] = useState<number | null>(null);
const pickPartner = (i: number | null) => setPartnerType(i); // CTAs call this; their href="#contact" does the scroll
// <LandingHero t={t} onPick={pickPartner} />  <LandingPartnership t={t} onPick={pickPartner} />
// <LandingContact t={t} partnerType={partnerType} setPartnerType={setPartnerType} />
```
New section order in `<main>`: Hero, then a container with Numbers, then the full-bleed Model, then a container with Market + Roadmap, then the full-bleed Partnership (surface), then Team (founder band + container part), then a container with FAQ + Contact, then the Footer. Keep `<hr className="border-line">` between paper sections that touch. *(Rev 2 #6 inserts Order after Model.)*

## 3. Interaction patterns (one choice each)
| Need | Use |
|---|---|
| Explorer stops, roadmap years | Base UI `Tabs` (roving focus, arrows, ARIA) |
| Stock toggle, form partner type | Native radio inputs styled as segmented control or chips |
| FAQ, plant specs | Native `<details>/<summary>` |
| Budget | Native `<select>` |
| Mobile nav | Existing Base UI `Sheet` |

## 4. Content mapping: old → new (nothing real is dropped)
| Old key / component | New home |
|---|---|
| `nav` | `nav` with 6 new anchors (01) |
| `cta` | `cta` with new text "Хамтрагч болох / Become a partner"; the old "Захиалга өгөх / Request a quote" becomes the buyer CTA in 06 |
| `hero.kicker/l1/l2` | 01, unchanged |
| `hero.sub` | 01, rewritten (adds the partner/investor invitation) |
| `hero.cta2` ("Үйлдвэрийг үзэх") | retired; replaced by `hero.ctaDeck`. The explorer is reachable from nav |
| `stats` | 02 `numbers.items` (0–3 unchanged) |
| `about.p1` | 05 roadmap (2008 / 2010 items say the same) |
| `about.p2` | 03 stop 1 body |
| `about.regions` | 03 stop 1 facts (Dornod, Sükhbaatar) + stop 7 body (Ulaanbaatar) |
| `about.mapNote/mapLabels/legend1/legend2`, `MAP_NODES` | 03 `model.map`, stops 1 and 7 media |
| `about.kicker/title` | retired; meaning lives in 03's title |
| `process.*` (steps, gate, video, prev/next, stepWord) | 03 stops 2–6 + `model.*` UI strings |
| `STEP_MEDIA`, `VIDEOS` | 03, extended to 7 entries (`map` for stops 1 and 7) |
| `cap.sub` | 03 `model.sub` |
| `cap.big` (2312 m², 142 m, 800 head) | 02 item 4 + 03 stops 3 and 5 facts |
| `cap.th/rows` | 03 `<details>` full specs table (unchanged) + per-stop facts |
| `cutting-team.jpg` | 06 plate |
| `prod.items` | 03 stop 7 product list (+ `stock` field) + summarised in 06 buyer offer + 08 Q4 |
| `prod.exportTag` | 03 stop 7 |
| `founder.*` | 07a, unchanged |
| `std.items` | 07 certifications (+ `issuer`) + market "why" + FAQ Q3 |
| `hist.years` | 05 `roadmap.items[0–9]`, unchanged |
| `hist.kicker/title` | retired → `roadmap.sub` |
| `partners.items/jobs/csr/title` | 07, unchanged |
| `contact.*` | 09. `buyers` → `types` (Institution and Export processor fold into "Buyer or distributor"); `thanks/thanksBody/again` → `opened*` / `back` |
| `footer.*` | 10, + `regNo` |

## 5. Global fixes (from `tokens.md`)
1. `.btn-primary`, `.tag-outline` on light: text `var(--gold-700)` (gold on paper is 3.0:1).
2. Inquiry form inputs: `border-ink/50` (the hairline `line` is 1.4:1).
3. Muted text floor `text-ink/70`. Replace the `text-ink/45` step and region numbers (2.7:1); 24px+ may use ink/60.
4. Touch targets ≥44px: `.btn-icon`, language toggle, chips, footer links.
5. `layout.tsx`: add `"cyrillic-ext"` to both font `subsets` (Ө/Ү preload).
6. Hero h1 clamp floor 46 → 40px.
7. Remove the uppercase kicker from section headings, except hero, explorer and founder.
8. Optional: the `layout.tsx` description could mention partnership and investment (МН), e.g. "…хамтын ажиллагаа, хөрөнгө оруулалтад нээлттэй." Owner's call.

## 6. Motion hooks (for the motion-engineer)
Suggested `data-motion` names: `hero-sequence`, `numbers-count`, `model-panel`, `model-route`, `model-stock`, `model-map-pulse`, `roadmap-rule`, `roadmap-panel`, `faq-item`, `form-error`, `form-state`, `partner-chip-confirm`, `lang-swap`.
- The page must be complete and correct with no JS animation. Counters render final values in the HTML.
- The language swap must not shift layout. The MN strings are longer, so reserve height with the MN version (e.g. `min-h` on the hero sub).

## 7. Launch gate
- `grep -n "PLACEHOLDER" src/components/landing/data.ts` must return nothing. For each hit, either fill the value (brief TODO(owner)) or delete the entry; every section spec defines its empty state.
- Also clear the `[…]` founder placeholders (existing TODO(client)).
- Check at 390px and 1280px in **MN** (longer copy): no horizontal scroll, no clipped labels.
- Tab through the whole page once: focus is visible everywhere, explorer and roadmap work with arrows, and the form errors are announced.

## 8. Open questions
- **Owner:** the 17 `TODO(owner)` items at the top of `brief.md`. Blocking for launch: 1, 2, 10, 14. Section 04 depends on 3.
- **Design (defaults chosen, change if you disagree):**
  - The partner/return calculator is skipped in v1 (see brief).
  - Section 04 Market is kept as a placeholder shell. Drop it if no sourced figures arrive.
  - Form partner types collapse from 4 old buyer types to Investor, Buyer or distributor, Livestock supplier, and Other.
  - The explorer's default stop is 1 (Pasture) and default stock is small.
  - The roadmap's default year is 2025, the last done item.

## Implementation status (implementer, step 2)
Commands run: `pnpm lint` (clean), `npx tsc --noEmit` (clean), `pnpm build` (clean; `/` still `○ Static`). Prerendered HTML checked: explorer stop 1 panel, tablists, 8 `<details name="faq">` present.

| Section | Status |
|---|---|
| data.ts restructure + §5 fixes 1-7 | done (fix 8, layout description, left as owner's call) |
| Header + 01 Hero | done |
| 02 Numbers | done (counts not animated; `data-count` holds the final value) |
| 03 Model explorer | done (Base UI Tabs, stock radios, gate re-closes, `<details>` specs) |
| 04 Market | done (placeholder shell; works with `stats: []`) |
| 05 Roadmap | done (Base UI Tabs, Today marker, 3 planned placeholders) |
| 06 Partnership | done (CTA sets type via `onPick`, focuses Name after 700 ms) |
| 07 Team | done (founder band reused; `pdf?` link supported on certs) |
| 08 FAQ | done (`{phone}` token rendered as a `tel:` link) |
| 09 Form | done (mailto prefill, client validation, opened state keeps values) |
| 10 Footer | done |
| Absorbed components deleted | done (about, process, capacity, products, standards, partners, timeline) |
| Launch gate | **blocked on owner**: 56 `PLACEHOLDER` hits remain in `data.ts`, kept visible as specified |
| Not verified | 390/1280 px visual check, keyboard pass, Lighthouse (no dev server run) |

Motion hooks added (`data-motion`): `hero-photo`, `hero-sequence` (children `data-step` = kicker, headline, sub, ctas, certs), `numbers-count` (cells carry `data-count`), `model-panel` (+ `data-dir` next/prev), `model-route`, `model-stock` (facts list and products list), `model-map-pulse` (highlighted map nodes), `roadmap-rule`, `roadmap-panel`, `faq-item`, `form-error`, `form-state`, `partner-chip-confirm` (+ `data-selected`), `lang-swap` (on `<main>`). Hero sub reserves its MN height with `min-h-[8lh]` / `sm:min-h-[5lh]`.

## Motion status (motion-engineer, step 3)
No dependency added: CSS in `globals.css` (end of file) + one IntersectionObserver hook. `pnpm lint` clean, `pnpm build` clean, `/` still `○ Static`. Not verified in a browser (no dev server run). Gate: an inline script in `layout.tsx` adds `html.mo`; hidden initial states exist only under it, so no-JS shows everything. All CSS motion is inside `@media (prefers-reduced-motion: no-preference)`; JS motion checks the same query.

| Animation | Hook | Duration | Reduced motion |
|---|---|---|---|
| Hero photo settles from 1.06 zoom | `hero-photo` | 1.2s | none |
| Hero sequence, staggered fade-up (kicker .1s, headline .25, sub .4, ctas .55, certs .7) | `hero-sequence` `[data-step]` | 0.5s each, ends 1.2s | all shown at once |
| Count-up of leading integer, once at 50% visible, suffix static, `[PLACEHOLDER]` skipped | `numbers-count` `[data-count]` (`use-count-up.ts`, called from `page.tsx`) | 1s ease-out | final values immediately |
| Explorer panel fade + 24px shift by direction | `model-panel` `data-dir` | 0.35s | instant |
| Route line grows/retracts (now `scaleX`, was `width`) | `model-route` | 0.4s | instant |
| Stock-changed facts/products crossfade | `model-stock` (keyed by stock) | 0.3s | instant |
| Map node pulse once | `model-map-pulse` | 0.7s | none |
| Roadmap detail crossfade, year swaps without counting | `roadmap-panel` | 0.3s | instant |
| FAQ height reveal (Chromium `::details-content`; elsewhere instant), icon already rotates | `faq-item` | 0.2s | instant |
| Form error fade, form/opened crossfade | `form-error`, `form-state` | 0.15s / 0.2s | instant |
| Partner chip gold flash on select | `partner-chip-confirm` `data-selected` | 0.7s | none |
| MN/EN text crossfade (Web Animations API on `<main>`) | `lang-swap` | 0.2s | none |

Small markup edits: `key` on the explorer and roadmap panels and the stock lists (to restart animations), route line uses `scaleX`.
Deferred: roadmap solid-rule draw (see `questions.md`); 04 Market and 06/07/10 sections intentionally static.

## Revision 2: implementation status
| # | Status | Note |
|---|---|---|
| 1 | done | QR `max-md:order-last max-md:max-w-[200px]` |
| 2 | done | `numbers.items[0].n` = `String(new Date().getFullYear() - 2008)` (mn + en) |
| 3 | done | Stop rail scrollbar hidden |
| 4 | done | Specs table fits: wrapper and `min-w` removed, `max-sm:text-[14px]` |
| 5 | done | Cert names, roadmap year and planned year use `text-gold-700` (planned stays italic) |
| 6 | done | Order moved after Model (page and nav, mn + en); Numbers alone in the first container |
| 7 | done | `viewport.themeColor`, `color-scheme: light`, `.input:autofill`, `.input option` |
| 8 | done | `hero.ctaDeck` secondary button: `onPick(0)`, focus `#c-name` after 700 ms |
| 9 | done | `phoneAlt` on load error, empty and submit error; `withPhone` exported; loading box dashed `min-h-[240px]` |
| 10 | done | Price 30px ink, `totalKg` (only when every item has kg), 6 items + `<details>`, one Select/+ button, selected edge + tag |
| 11 | done | `order.kicker` removed; `facts` 2x2 `<dl>`; `storage.jpg` plate at `lg+`, no filter |
| 12 | done | Sticky bar (`data-motion="order-bar"`), `#order-form` card |
| 13 | done | Seasonal strip in `page.tsx` (`OrderStrip`, hidden when `order.strip` is empty) |
| 14 | partial | `order.qa` rows done. `order.privacy` is `""` in both languages (owner has not approved the wording; proposed sentence in a `TODO(owner 23)` comment); the line renders only when non-empty. Q&A answers are `[PLACEHOLDER]` |
| 15 | skipped | Reviewer override: the client's Classical system keeps the caps |
| 16 | done | Added `"latin-ext"` to the Source Serif 4 `subsets` |

Motion hooks added: `order-bar`; reused `form-state` (order card) and `faq-item` (items disclosure, order Q&A). No animation CSS added.
New `[PLACEHOLDER]` hits: 6 (`facts[2]`, `qa[0].a`, `qa[1].a`, per language).
Protected functions in `landing-order.tsx`: `landing-order.tsx` is untracked, so `git diff` shows nothing. I diffed against a copy taken before editing, and no changed hunk falls inside `gql`, the packages effect, `submit`, `check`, the polling effect or `reset` (changes are imports, helper consts, and everything from `return` down).
Commands: `pnpm lint` (clean), `pnpm build` (clean; `/` is `○ Static`), `grep -rn "sepia\|grayscale\|saturate(" src` (none). The prerendered HTML contains the strip text and the facts. Not run: dev server, 390/1280 px visual pass, keyboard pass.

### Revision 2: motion
- `order-bar`: reuses `mo-up` (0.2s ease-out) on mount; inside the reduced-motion guard, so with reduced motion it just appears. `form-state` and `faq-item` reuse their v1 rules. The seasonal strip stays static.
