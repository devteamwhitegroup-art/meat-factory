# 07 Team & trust (`#team`)

## Revision 2 changes
| Change | Reason |
|---|---|
| Cert names (40px): `text-gold` → `text-gold-700` | Recomputed on paper `#e6e0d4`, gold is 2.6:1, below the 3:1 large-text floor. Gold-700 is 5.1:1. |
| Partner logos stay conditional on TODO 12, but this is now the preferred end state | Easy Meat shows a "Харилцагчид" logo block. Named B2B buyers with logos (and alt text, which Easy Meat lacks) are stronger proof than text rows. Until permission arrives, keep the text list. |
| Cert PDFs (TODO 11) promoted to "high value" | Easy Meat claims HACCP in prose with no proof, and Primeat claims nothing. A downloadable certificate is the cheapest credibility win available to us. |

## Purpose
Put real people, certificates and named buyers behind the numbers. These are the three things investors check before replying.

## Content fields (`data.ts`)
| Key | Type | Notes |
|---|---|---|
| `founder.*` | `{kicker, quote, name, role, body}` | quote, name and body are still `[…]` (TODO 10). Photo `/photos/owner.jpg` |
| `team.title`, `team.peopleTitle`, `team.people[]`, `team.certsTitle`, `team.pdf` | string / `{name, role, bio}` | |
| `std.items[]` | `{name, year, issuer, body, pdf?}` | |
| `partners.title`, `partners.items[]`, `partners.jobs[]`, `partners.csr` | existing | Photo `/photos/worker-portrait.jpg` |

## Copy
Unchanged; already in `data.ts` (`founder`, `team`, `std`, `partners`).

## Interaction
Mostly static.

| Element | Behaviour |
|---|---|
| Cert name | With `pdf` set, it is a link: new tab, **gold-700**, underline on hover, focus outline, and a visually hidden "(PDF)". Without `pdf`, plain gold-700 text. |
| Partner rows | Static text. With logos permitted (TODO 12): a monochrome `<Image>` 28px tall, `alt` = the partner name, and the note kept on the right. |

- **Empty:** `people: []` hides the leadership block. Founder placeholders block launch.

## Layout rules
- 07a: founder band in `bg-night-deep` (`LandingFounder`, unchanged). The photo is natural, with no filter.
- 07b on paper: h2 → people (3 columns) → Certifications | Partners (ruled lists) → the worker photo plate + jobs numerals + CSR line.
- Cert names are 40px serif **gold-700**. The year and issuer are 13px ink/70.

## Data source
Static, from `data.ts`.

## Motion notes
None. A quiet section.

## Acceptance
- [ ] Rev 2: no `text-gold` remains on paper in `landing-team.tsx`.
- [ ] Every existing founder, std and partners string is still rendered.
- [ ] Founder photo `alt={founder.name}`. The worker photo is decorative.
- [ ] Hides cleanly with `people: []`.
- [ ] Single column at ≤640px. "Зүүн бүсийн оношилгоо эмчилгээний төв" wraps while its note stays right-aligned.
