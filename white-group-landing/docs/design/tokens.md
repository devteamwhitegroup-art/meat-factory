# Tokens: reuse the existing "Classical" system

There is no new palette. Every colour below already exists in `src/app/globals.css` (`:root` + `@theme inline`). Contrast ratios are computed with the WCAG 2.1 formula. In Revision 2 they were **recomputed against the current paper `#e6e0d4`**, because several v1 figures dated from the old near-white paper.

## Revision 2 changes
| Change | Reason |
|---|---|
| **Glare section added** (theme-color, autofill, `color-scheme`, native `<option>` background). Paper stays `#e6e0d4` | The owner found near-white tiring. The page is warm now, but the browser still paints bright white in places we never styled: the mobile toolbar, autofilled inputs, and native dropdown lists. |
| **New `price` type token**, 30px ink, tabular | Competitors make the price the anchor of a bundle. Ours is 22px gold-700, smaller than the 24px package name. |
| **Contrast table recomputed; surface rows added**: forms stay on paper | The darker paper lowered every ratio. Gold-700 drops from 6.0 to 5.1:1 and is still fine. `destructive` on surface is 4.48:1 and ink/50 borders on surface are 2.9:1, so both fail and any form must sit on paper. |
| **Rail rule**: no visible horizontal scrollbars, and no horizontally scrolling tables | Owner feedback. The explorer rail and the specs table still scroll with a visible bar. |
| **Kicker rule restated**: drop `uppercase` in `Kicker` and in the hero kicker | The v1 rule (sentence case in MN) was not applied. The order section also added a kicker the rule doesn't allow. |
| **₮ glyph check** added | `layout.tsx` loads the `latin`, `cyrillic` and `cyrillic-ext` subsets. On Google Fonts, ₮ (U+20AE) belongs to `latin-ext`. Prices are now on the page, so verify they don't fall back to another font. |
| No photo filters, ever | Owner feedback. The sepia grade was removed and must not return. The only filter on the page is the explorer's slaughter-gate blur, which is a content gate, not a photo grade. |

## Colors (6 named)
| Name | Hex | Role | Tailwind |
|---|---|---|---|
| Paper | `#e6e0d4` | Page background for light sections. Warm and dimmed on purpose. **Do not go back to near-white.** | `bg-paper`, `text-paper` on dark |
| Surface | `#dcd5c7` | Plate mat, seasonal strip, Partnership band | `bg-surface` |
| Ink | `#201f1d` | Text, prices, the sticky order bar, the selected toggle fill | `text-ink`, `bg-ink` |
| Gold | `#b68235` | **Strokes only on light:** rules, the route line, active underlines (2.6:1 on paper). Focus rings and selected-card edges use **Gold 600** `#a06f24` (3.3:1). On dark, gold is fine as text. | `border-gold`, `stroke-gold` |
| Gold 700 | `#7d5411` | Any gold **text** on paper or surface | `text-gold-700` |
| Night deep | `#252323` | Dark bands: Explorer, Founder, Footer | `bg-night-deep` |

Supporting tokens (already defined, add nothing new):
- `night #2d2b2b` is the hero overlay.
- `gold-400` and `gold-300` are for gold text on dark.
- `gold-100` and `gold-800` are for `.tag-accent`.
- `line` (ink 16%) is for hairlines.
- `destructive #b3261e` is for errors on paper.
- **Pure white `#fff` appears only behind the QPay QR image,** because scanners need it. Nowhere else.

### Contrast checks (recomputed on `#e6e0d4` / `#dcd5c7`)
| Pair | Ratio | Use |
|---|---|---|
| ink on paper | 12.5:1 | all text, **prices** |
| ink/70 on paper | 5.3:1 | floor for small secondary text |
| ink/70 on surface | 5.0:1 | ✅ secondary text on the strip or Partnership |
| ink/60 on paper | 4.0:1 | only text ≥24px |
| gold on paper | 2.6:1 | ❌ text at any size below 24px bold. ✅ decorative strokes |
| gold-600 on paper | 3.3:1 | ✅ focus ring, selected-card edge (non-text ≥3:1) |
| gold-700 on paper | 5.1:1 | ✅ gold text |
| gold-700 on surface | 4.6:1 | ✅ gold text (strip link), with little headroom: never lighter |
| gold-300 on ink | 11:1 | ✅ sticky order bar button |
| paper on ink | 12.5:1 | ✅ sticky order bar text |
| destructive on paper | 5.0:1 | ✅ error text |
| **destructive on surface** | **4.48:1** | ❌ for 13.5px text, so **no forms on surface** |
| ink/50 on paper | 3.0:1 | ✅ form field borders (WCAG 1.4.11), just passes |
| **ink/50 on surface** | **2.9:1** | ❌. If a field ever sits on surface, use `border-ink/60` (3.8:1) |
| line on paper | 1.4:1 | decorative hairlines only |

The 40px gold cert names in 07 are decorative large text at 2.6:1. **Move them to gold-700** (5.1:1). Large text needs 3:1, and gold doesn't reach it on this paper.

## Glare (Revision 2)
Paper stays. These four items stop the browser from adding white where we never chose it:
1. **Mobile browser chrome.** In `layout.tsx`, add `export const viewport: Viewport = { themeColor: "#e6e0d4" }`. Android Chrome's toolbar and Safari's tab bar then match the paper header instead of flashing white.
2. **`color-scheme: light`** on `:root`. This keeps form controls and scrollbars in their light theme, so dark-mode OS settings can't invert parts of the page.
3. **Autofill.** Chrome paints autofilled fields pale blue or white, and both forms use `autoComplete` (name, tel, street-address). In `@layer components`, add:
   `.input:autofill, .input:-webkit-autofill { -webkit-text-fill-color: var(--ink); box-shadow: inset 0 0 0 1000px var(--paper); }`
4. **Native dropdown list.** The budget `<select>` opens a white list on Windows. Add `.input option { background: var(--paper); color: var(--ink); }` (Chromium honours it; other browsers ignore it harmlessly).

Not proposed: a dark mode (the system is a fixed light design), or lowering text contrast (AA comes first).

## Typefaces
One variable family: `Source_Serif_4` with the `opsz` axis, loaded in `layout.tsx` as `--font-serif`. Both `font-heading` and `font-sans` point to it. **Keep it.**

| Face | Weights | Role |
|---|---|---|
| **Source Serif 4** (`font-heading`) | 400, 600 | Display, h2/h3, **all numerals and prices** (`tabular-nums`), buttons |
| **Source Serif 4** (`font-sans`, body) | 400, 600 | Body, labels, form text, table cells |

**Cyrillic:** Ө ө Ү ү come from `cyrillic-ext`, which is loaded.

**₮ check (Rev 2):** in DevTools, inspect a price → Computed → Rendered Fonts. If ₮ shows a fallback font, add `"latin-ext"` to `subsets` in `layout.tsx`. If Source Serif 4 has no ₮ glyph at all, accept the system fallback; don't swap fonts.

## Type scale (existing values, plus `price`)
| Token | Size / line-height | Where |
|---|---|---|
| display | `clamp(40px, 6.4vw, 92px)` / 1.04 | Hero h1 |
| h2 | `clamp(34px, 3.8vw, 52px)` / 1.08 | Section titles |
| numeral-xl | `clamp(64px, 9vw, 128px)` / 0.9 | Roadmap active year |
| numeral-l | `clamp(40px, 4vw, 56px)` / 1 | Key numbers, team stats |
| h3 | `clamp(24px, 2.4vw, 32px)` / 1.2 | Stop titles, option titles |
| **price** (new) | **30px / 1, 400, ink, `tabular-nums`** | Order card price, the largest text on the card. The total line in the summary uses 20px. |
| h4 | 22px / 1.25, 600 | List titles, FAQ questions |
| body | 17px / 1.65 | Paragraphs |
| small | 15–15.5px / 1.6 | Card body, facts, answers, package items |
| label | 12.5–13px | Field labels, stat labels. **Sentence case in every language.** Drop `uppercase` from `Kicker` (`section-heading.tsx`) and from the hero kicker. Tracking ≤0.08em. |

**Kicker rule:** kickers only in Hero (place · year), Explorer and Founder. The order section's `order.kicker` goes.

**Price format:** `879,000₮`, with a comma thousands separator, ₮ as a suffix and no space, matching local convention (both competitors).

## Spacing (existing, 4px base)
| Token | Value |
|---|---|
| container | `max-w-[1200px] px-[clamp(20px,5vw,72px)]` |
| section y | `py-26` desktop · `py-18` ≤640px |
| block gap | `gap-x-[clamp(32px,6vw,96px)]` |
| stack | 8 · 12 · 16 · 24 · 36 · 48px |
| row | list rows `py-1.5`–`py-5` with `border-b border-line` |
| sticky bar | min-h 56px, `px` = container gutter |

## Radii (existing)
| Token | Value | Use |
|---|---|---|
| `rounded-md` | 4px | `.btn`, `.card`, `.input`, plates |
| `rounded-lg` | 7px | Sheet only |
| `.tag` | 3px | tags |
| `rounded-full` | — | explorer and map nodes only |

## Rails and overflow (Revision 2)
- Every horizontally scrolling rail uses `overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`: the roadmap (already) and the explorer stops (to add). With two uses, inline the classes; extract a `.rail` class only if a third appears.
- A hidden scrollbar needs another cue: the active item is centred (`centerInRail`), and the next item is visibly cut at the edge.
- **Tables never scroll horizontally.** Let the cells wrap instead.
- No new rails. The order packages stack vertically on mobile, because comparing contents in a swipe carousel is worse than scrolling.

## Interaction floor
- Focus is the existing `:focus-visible` (2px gold-600, offset 2). Never remove it.
- Touch targets ≥44px. Primary form and order buttons are 48px.
- `.plate` (surface mat + hairline) is the photo treatment. **Photos are always natural, with no filter.**
