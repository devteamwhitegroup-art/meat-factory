# 04 Market opportunity (`#market`)

## Purpose
Show investors the market around the plant with **sourced** figures, then state, using only proven facts, where White Group stands in it.

## Content fields (`data.ts`)
| Key | Type | Notes |
|---|---|---|
| `market.title`, `market.sub` | string | |
| `market.stats[]` | `{ n: string; l: string; src: string }` | Every figure needs a source line. Nothing is shown without one |
| `market.whyTitle` | string | |
| `market.why[3]` | `{ title, body }` | built only from facts already in `data.ts` |

## Copy
| Key | mn | en |
|---|---|---|
| title | Зах зээлийн боломж | The market opportunity |
| sub | Монголын мал аж ахуй, махны экспортын гол үзүүлэлтүүд. | Key figures for Mongolian livestock and meat exports. |
| stats[0] | n `[PLACEHOLDER]` · l сая толгой мал, Монгол улс · src Эх сурвалж: [PLACEHOLDER — ҮСХ, он] | n `[PLACEHOLDER]` · l million head of livestock in Mongolia · src Source: [PLACEHOLDER — NSO, year] |
| stats[1] | n `[PLACEHOLDER]` · l сая толгой мал, Дорнод ба Сүхбаатар аймаг · src Эх сурвалж: [PLACEHOLDER] | n `[PLACEHOLDER]` · l million head in Dornod and Sükhbaatar · src Source: [PLACEHOLDER] |
| stats[2] | n `[PLACEHOLDER]` · l мян. тонн мах экспортолсон, жилд · src Эх сурвалж: [PLACEHOLDER] | n `[PLACEHOLDER]` · l thousand tonnes of meat exported per year · src Source: [PLACEHOLDER] |
| whyTitle | Бидний давуу тал | Where we stand |
| why[0] | **Гарал үүсэл тодорхой** — Малаа Дорнод, Сүхбаатарын малчдаас шууд бэлтгэдэг. | **Known origin** — Livestock bought directly from Dornod and Sükhbaatar herders. |
| why[1] | **Олон улсын стандарт** — HACCP, HALAL (2023), ISO 9001:2016 (2025) стандартаар баталгаажсан. | **International standards** — Certified HACCP and HALAL (2023) and ISO 9001:2016 (2025). |
| why[2] | **Нэг дээвэр дор** — Төхөөрөхөөс хадгалах хүртэл бүх шат 2020 онд ашиглалтад орсон нэг үйлдвэрт. | **Under one roof** — Every stage from slaughter to storage in one plant, opened in 2020. |

The stat figures come from TODO(owner) 3. A suggested source is the National Statistics Office (1212.mn). The owner supplies the numbers.

## Interaction
Static.
- **Empty:** if `market.stats` is `[]`, hide the stats row. The h2 then sits above "Бидний давуу тал", and the section still makes sense. If the owner drops the section entirely, remove `#market` from `nav`.
- **Placeholder:** render as-is, and let the launch gate catch it.

## Layout rules
- Desktop: the h2 and sub take the left third. The 3 stats sit in the right two-thirds, divided by vertical hairlines. Below them, a full-width hairline and the 3 "why" points in 3 columns.
- Numerals are numeral-l. Source lines are 12.5px `text-ink/70`, and if the owner provides a URL the source is a link (`text-gold-700 underline`).
- No icons. No cards.

## Data source
Static, from `data.ts` → `market`.

## Motion notes
None. The section stays quiet. If real numbers arrive, they may reuse the 02 count-up behaviour; the motion-engineer decides.

## Acceptance
- [ ] No figure renders without a `src` line.
- [ ] The section works with `stats: []`.
- [ ] MN labels wrap cleanly in the 3-column stats at 1024px. At ≤640px everything stacks.
- [ ] "Why" copy contains no claim beyond the facts listed in the brief.
