# 03 Business model explorer (`#model`): the one bold section

## Revision 2 changes
| Change | Reason |
|---|---|
| Stop rail: add `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` to the `overflow-x-auto` rail wrapper | Owner rule: horizontal rails show no scrollbar, as the roadmap already does. This rail (`min-w-[672px]`) still shows one below ~720px. Scrollability stays clear: the active stop is centred (`centerInRail`), the neighbouring stops are cut at the edge, and Prev/Next exist. |
| Plant specs table: remove `min-w-[460px]` and the `overflow-x-auto` wrapper, let cells wrap, 14px below 640px | The table was the other horizontal scroller. Hiding its scrollbar would hide cut-off columns, and three short columns fit 350px if they wrap. |
| The 03b Winter order now **follows this section directly** | Competitors put a price in front of the visitor with no provenance. This section is the provenance, so the boldness here now also sells the package that follows. No change inside this section is needed for that. |
| The Visual note said "Cormorant numerals"; corrected to Source Serif 4 | The font is now Source Serif 4 for everything (owner). |

Everything else stays as specified below.

## Purpose
Show the whole business on a single route: where the animals come from, what happens at each stage of the plant, what comes out, and who buys it. A partner or investor should understand the model in about 30 seconds.

## Content fields (`data.ts`)
| Key | Type | Notes |
|---|---|---|
| `model.kicker`, `model.title`, `model.sub` | string | |
| `model.stockLabel` | string | legend of the stock toggle |
| `model.stocks` | `[small, large]` | toggle labels |
| `model.groups` | `[source, plant, market]` | bracket labels over the rail. Source = stop 1, Plant = stops 2–6, Market = stop 7 |
| `model.stops[7]` | `{ short, title, body, facts: [label, value][], stockFacts?: { small, large }, partner?: string }` | `short` is the rail label; `stockFacts` are appended to `facts` for the active stock |
| `model.productsL`, `model.specs` | string | stop 7 product list heading; `<details>` summary |
| `model.stepWord`, `prev`, `next`, `videoTag`, `gateTitle`, `gateBody`, `gateBtn`, `pending` | string | |
| `model.map` | `{ note, labels[4], legend1, legend2 }` | |
| `prod.items[]` with `stock: "small" \| "large"` | existing | product list for stop 7. Export horse meat counts as `large` |
| `cap.th`, `cap.rows` | existing | full specs table inside `<details>` |
| `STEP_MEDIA` (7 entries), `MAP_NODES`, `VIDEOS` | const | existing |

## Copy
Unchanged from v1 and already in `data.ts` (`model.*`, `model.stops[0–6]`, `prod.items`, `cap.*`). For reference:

| Key | mn | en |
|---|---|---|
| kicker | Бизнес загвар | Business model |
| title | Бэлчээрээс худалдан авагч хүртэл | From pasture to buyer |
| sub | 2020 онд ашиглалтад орсон 2312 м² үйлдвэрт төхөөрөх, задлах, сэврээх, хөлдөөх, хадгалах бүх шат нэг дор. Шат бүрийг сонгож үзнэ үү. | Slaughter, cutting, chilling, freezing and storage all happen in one 2,312 m² plant opened in 2020. Select a stage to see how it works. |
| stockLabel | Малын төрөл | Livestock |
| stocks | Бог мал · Бод мал | Small stock · Large stock |
| groups | Эх үүсвэр · Үйлдвэр · Зах зээл | Source · Plant · Market |
| productsL | Бүтээгдэхүүн | Products |
| specs | Үйлдвэрийн бүх үзүүлэлт | Full plant specifications |
| stops[0–6] | see `data.ts` `mnStops` | see `data.ts` `enStops` |

## Interaction
**Pattern:** WAI-ARIA Tabs via Base UI `Tabs`. The rail is `Tabs.List`, the stops are `Tabs.Tab`, and the media and text block is the active `Tabs.Panel`.

| Element | Behaviour and states |
|---|---|
| Stop node (tab) | **Default:** 14px circle, paper-outline ring, label paper/70. **Hover:** label paper, ring gold. **Focus:** gold-600 outline. **Active:** filled gold node with an 8px gold/18 halo and a paper 600 label. The route line is solid gold up to the active stop and dashed gold/35 after it. Hit area ≥44×44. |
| Keyboard | ←/→ move between stops, Home/End jump to the ends, and selection follows focus. |
| Prev / Next | Same as ←/→ but they do not wrap: `aria-disabled` + 40% opacity at stops 1 and 7. 44px. |
| Stock toggle | `<fieldset>` + 2 radios as a segmented control. Changes only stop 3 capacity, stop 4 cuts and the stop 7 products. |
| Slaughter gate (stop 3) | Blurred photo plus `[▶ Бичлэгийг үзэх]`. Re-closes when the visitor leaves the stop. The blur is a content gate, not a photo grade: it is the only filter on the page and it stays. |
| Map (stops 1, 7) | Illustrative. The SVG is `aria-hidden` and the labels are visible. |
| `<details>` specs | Native disclosure, summary ≥44px. **Rev 2:** the table wraps inside the container with no horizontal scroll at any width. |
| Mobile rail | `overflow-x-auto` + `snap-x`, **with no visible scrollbar (Rev 2)**. The active tab is centred on change. Only the active label is visible below `md`; the others stay `sr-only`. |

- **Loading:** `next/image` with `sizes`. The plate is `bg-night`, so there is no white flash.
- **Empty:** a stop with no facts hides the list. A missing video shows the `pending` tag.
- **Error:** an image error shows the night plate with the caption still visible.

## Visual
- Full-bleed `bg-night-deep` band with paper text. This is where the page spends its boldness: large **Source Serif 4** numerals ("03 / 07"), the gold route line, and a plate with a paper/12 mat. Photos are natural, with no grade.
- No cards. Facts are a `<dl>` with paper/15 hairlines.

## Data source
Static, from `data.ts` → `model`, `prod.items`, `cap.th/rows`, `STEP_MEDIA`, `MAP_NODES`, `VIDEOS`.

## Motion notes
Unchanged:
- The panel crossfades and shifts in the direction of travel.
- The route line fills or retracts on the same timing.
- On a stock change, only the changed facts crossfade.
- The map nodes pulse once.
- Reduced motion: all of this is instant.

## Acceptance
- [ ] Rev 2: no visible horizontal scrollbar on the stop rail at 390, 768 and 1024px (Chrome, Safari, Firefox).
- [ ] Rev 2: the specs table has no horizontal scroll at 390px MN. "Задлан, нядалгааны хэсэг" and "500 бог · 300 бод / хоног" wrap inside their cells.
- [ ] Fully keyboard-operable as tabs, and the panel is labelled by its tab.
- [ ] The stock toggle changes stop 3 capacity, stop 4 cuts and the stop 7 products, and nothing else.
- [ ] At 390px: the rail scrolls, the active stop stays visible, and the page has no horizontal scroll.
- [ ] The gate never shows the slaughter photo unblurred before opt-in, and resets on leaving.
- [ ] Contrast on dark: labels ≥ paper/62, and gold text uses gold-400.
