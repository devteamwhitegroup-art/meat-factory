# 05 Growth roadmap (`#roadmap`)

## Revision 2 changes
| Change | Reason |
|---|---|
| Active year numeral: `text-gold` → `text-gold-700`. Planned: `text-gold/60 italic` → `text-gold-700 italic` (no opacity) | Recomputed on paper `#e6e0d4`: gold is 2.6:1 and gold/60 is lower still. Both are below the 3:1 large-text floor. Gold-700 is 5.1:1. Planned items stay distinct through italic, the dashed rule and the tag, not opacity. |
| Active tab: `border-gold text-gold-700` stays. Inactive tab text `text-ink/60` stays (4.0:1 at 24px ≥ 3:1) | No change needed |
| Rail scrollbar | Already hidden. This is the reference the owner pointed to. |

## Purpose
Prove momentum with the real 2008–2025 track record, then show what comes next. Investors read the past as evidence for the plan.

## Content fields (`data.ts`)
| Key | Type | Notes |
|---|---|---|
| `roadmap.title`, `roadmap.sub` | string | |
| `roadmap.today` | string | marker between the last done item and the first planned one |
| `roadmap.status` | `{ done, planned }` | tag labels |
| `roadmap.items[]` | `{ year, text, planned?: true }` | 10 real items, then the planned ones |

## Copy
Unchanged; already in `data.ts`.

| Key | mn | en |
|---|---|---|
| title | Замнал ба төлөвлөгөө | Track record and roadmap |
| sub | 2008 оноос хийж ирсэн ажил, цаашдын төлөвлөгөө. | What we have done since 2008, and what comes next. |
| today | Өнөөдөр | Today |
| status.done / planned | Хэрэгжсэн / Төлөвлөсөн | Done / Planned |
| items[0–9] | `mnRoadmap` 2008…2025 | `enRoadmap` 2008…2025 |
| items[10–12] | `[PLACEHOLDER]` planned (TODO 4) | same |

## Interaction
Tabs (Base UI).

| Element | Behaviour and states |
|---|---|
| Year tab, done | Default 24px serif ink/60. Hover gold-700. Focus gold-600 outline. Active gold-700 + 2px gold underline. ≥76×44px. |
| Year tab, planned | Same, italic, with a dashed rule. |
| "Today" marker | Not focusable. Gold hairline + 12px gold-700 label. |
| Keyboard | ←/→/Home/End. |
| Detail panel | Year numeral-xl **gold-700** (planned: gold-700 italic), a status tag, and the text as h3 serif. |
| Mobile | The rail scrolls x with **no visible scrollbar** and starts on the active year. |

- **Default selection:** the last done item.
- **Empty:** with no planned items, hide "Today" and the dashed rule.
- **Placeholder:** render as-is (launch gate).

## Data source
Static, from `data.ts` → `roadmap`.

## Motion notes
Unchanged: the detail crossfades and the year swaps without counting. The rule draw is deferred (see `questions.md`). Reduced motion: instant.

## Acceptance
- [ ] Rev 2: the active and planned year numerals are gold-700, and no gold-on-paper text remains in this section.
- [ ] All 10 historical items are present, unchanged.
- [ ] Planned items are distinct in two non-colour ways (italic + dashed rule, and the tag).
- [ ] Tabs work by keyboard, and every target is ≥44px.
- [ ] At 390px the rail scrolls in its own box with no scrollbar and no page overflow.
- [ ] Works with 0 planned items.
