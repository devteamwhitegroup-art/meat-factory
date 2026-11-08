# 02 Key numbers (`#numbers`)

## Revision 2 changes
| Change | Reason |
|---|---|
| `items[0].n`: `"17"` → `String(new Date().getFullYear() - 2008)` in both `mn` and `en` | It is 2026, so "17 years" since 2008 is out of date (brief TODO 2). The value is computed at build time and prerendered, so a yearly rebuild keeps it right. The count-up still works because it reads `data-count`. |

Nothing else changes. Neither competitor shows company figures at all; this section is already a differentiator.

## Purpose
Give investors and buyers the hard facts (track record, capacity, scale) in one glance, right after the hero.

## Content fields (`data.ts`)
| Key | Type | Notes |
|---|---|---|
| `numbers.title` | string | |
| `numbers.items[]` | `{ n: string; l: string }` | `n` is the display string; it may contain units ("500 т", "10+") |
| `numbers.note` | string | footnote with as-of year |

The 8 items are fixed in this order.

## Copy
| Key | mn | en |
|---|---|---|
| title | Гол үзүүлэлтүүд | Key figures |
| items[0] | n *years since 2008 (computed)* · l жил салбартаа | n *same* · l years in the trade |
| items[1] | n `500` · l бог мал хоногт төхөөрөх | n `500` · l sheep & goats slaughtered per day |
| items[2] | n `300` · l бод мал хоногт төхөөрөх | n `300` · l cattle & horses slaughtered per day |
| items[3] | n `500 т` · l хөлдүү махны агуулах | n `500 t` · l cold storage |
| items[4] | n `2312 м²` · l үйлдвэрийн талбай · 2020 | n `2,312 m²` · l plant · opened 2020 |
| items[5] | n `10+` · l Улаанбаатарын бөөний худалдан авагч | n `10+` · l wholesale buyers in Ulaanbaatar |
| items[6] | n `[PLACEHOLDER]` · l тонн мах, жилд | n `[PLACEHOLDER]` · l tonnes of meat per year |
| items[7] | n `[PLACEHOLDER]` · l жилийн борлуулалт, ₮ | n `[PLACEHOLDER]` · l annual revenue, MNT |
| note | Хоногийн тоо — үйлдвэрийн хүчин чадал. Бусад тоо [PLACEHOLDER] оны байдлаар. | Per-day figures are plant capacity. Other figures as of [PLACEHOLDER]. |

Items 6–7 come from TODO(owner) 1.

## Interaction
Static, with no clickable elements.
- **Empty:** if the owner cannot supply items 6–7, delete them. Six items fall into 3×2 or 2×3 with nothing else to fix.
- **Placeholder:** render as-is. The launch gate (handoff) blocks deploy while it remains.

## Layout rules
- Hairline grid: `border-t border-line`, cells with `border-b`, and `border-r` on desktop. No cards, no backgrounds.
- Numerals are `font-heading` numeral-l with `tabular-nums`. Labels are 13px `text-ink/70` in sentence case.
- MN labels may wrap to 3 lines. Align cells to the top so the numerals in a row share one baseline.

## Data source
Static, from `data.ts` → `numbers`.

## Motion notes
- Each numeric value counts up once, the first time the grid is ≥50% visible. Only the leading digits count; suffixes stay static, and `[PLACEHOLDER]` does not animate.
- Cell width must not change while counting (`tabular-nums`).
- Reduced motion: show final values immediately.

## Acceptance
- [ ] Item 0 reads 18 in 2026 in both languages and is in the prerendered HTML.
- [ ] 4 columns at ≥1024px and 2 columns at ≤640px. Hairlines meet cleanly.
- [ ] At 390px the longest MN label wraps without overflowing.
- [ ] Label contrast is ≥ ink/70.
