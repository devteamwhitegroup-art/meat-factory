# 06 Partnership options (`#partner`)

## Purpose
Let each visitor recognise themselves (investor, buyer or distributor, livestock supplier), see what is offered and expected, and go straight to the form with their type preselected.

## Content fields (`data.ts`)
| Key | Type | Notes |
|---|---|---|
| `partner.title`, `partner.sub` | string | |
| `partner.offerL`, `partner.needL` | string | list headings |
| `partner.options[3]` | `{ title, who, offer: string[], need: string[], cta }` | order = form partner types 0, 1, 2 |
| Photo | `/photos/cutting-team.jpg` | moved from old Capacity |

## Copy
| Key | mn | en |
|---|---|---|
| title | Хамтран ажиллах гурван зам | Three ways to work with us |
| sub | Өөрт тохирохыг сонгоод хүсэлтээ илгээнэ үү. | Pick the one that fits you and send us a request. |
| offerL | Бид санал болгоно | What we offer |
| needL | Нөхцөл | Terms |

### options[0]: investor
| field | mn | en |
|---|---|---|
| title | Хөрөнгө оруулагч | Investors |
| who | Монголын махны салбарт урт хугацаанд хөрөнгө оруулах сонирхолтой байгууллага, хувь хүн. | Organisations and individuals looking for a long-term stake in Mongolian meat processing. |
| offer | 2010 оноос тогтвортой нийлүүлэлт · 2020 онд ашиглалтад орсон 2312 м² үйлдвэр · HACCP, HALAL, ISO 9001 баталгаа | Steady supply since 2010 · A 2,312 m² plant opened in 2020 · HACCP, HALAL and ISO 9001 certified |
| need | Хөрөнгө оруулалтын хэмжээ: [PLACEHOLDER] · Зориулалт: [PLACEHOLDER] · Хэлбэр: [PLACEHOLDER — хувьцаа, зээл, хамтарсан төсөл] | Ticket size: [PLACEHOLDER] · Use of funds: [PLACEHOLDER] · Structure: [PLACEHOLDER — equity, debt, joint venture] |
| cta | Танилцуулга хүсэх | Request the deck |

### options[1]: buyer / distributor
| field | mn | en |
|---|---|---|
| title | Худалдан авагч, түгээгч | Buyers & distributors |
| who | Бөөний худалдаа эрхлэгч, экспортын эрхтэй үйлдвэр, байгууллагын худалдан авагч. | Wholesalers, export-licensed processors and institutional buyers. |
| offer | Хонь, ямаа, үхэр, адуу, тэмээний гулууз — сэрүүн, хөлдүү · Экспортын үйлдвэрт зориулсан HALAL адууны мах · 500 тонны агуулахаас хуваарьт ачилт | Sheep, goat, cattle, horse and camel carcasses, chilled or frozen · HALAL horse meat for export processors · Scheduled dispatch from a 500 t cold store |
| need | Доод захиалга: [PLACEHOLDER] · Төлбөр, хүргэлтийн нөхцөл: [PLACEHOLDER] | Minimum order: [PLACEHOLDER] · Payment and delivery: [PLACEHOLDER] |
| cta | Үнийн санал авах | Request a quote |

### options[2]: livestock supplier
| field | mn | en |
|---|---|---|
| title | Мал нийлүүлэгч | Livestock suppliers |
| who | Дорнод, Сүхбаатар аймгийн малчид, хоршоо. | Herders and cooperatives in Dornod and Sükhbaatar. |
| offer | Малчдаас шууд худалдан авалт · Хүлээн авахдаа мал эмнэлгийн үзлэг, бичиг баримт | Direct purchase from herders · Veterinary check and paperwork on intake |
| need | Нийлүүлэх улирал, тоо толгой: [PLACEHOLDER] · Төлбөрийн нөхцөл: [PLACEHOLDER] | Season and head count: [PLACEHOLDER] · Payment terms: [PLACEHOLDER] |
| cta | Мал нийлүүлэх | Offer livestock |

The `need` items come from TODO(owner) 5, 7 and 8.

## Interaction
| Element | Behaviour and states |
|---|---|
| Option CTA | `.btn .btn-primary` (gold-700 text on surface). Hover: gold/12 fill. Active: gold/22 fill. Focus: outline. ≥44px; full width on mobile. **Click** calls `pickPartner(i)`, which sets the form's partner type, and scrolls to `#contact`. After the scroll, focus moves to the **Name** field, because the type is already set. |
| Lists | Static. `—` dash bullets (`list-none` + pseudo dash), not icons. |

- **Empty:** if an option's `need` is `[]`, hide its "Нөхцөл" heading. If the owner removes an option, the grid becomes 2 columns. The form partner types stay as-is, because "Other" covers it.
- **Placeholder:** render as-is; the launch gate catches it.

## Layout rules
- Surface (`bg-surface`) full-bleed band to set it apart from paper sections. It is not a card grid.
- Three columns divided by `border-l border-line`, with CTAs pinned to the column bottom so they align (`flex flex-col` + `mt-auto`).
- MN text is the longest. At 1024px each column is ~300px. Test "Хөрөнгө оруулалтын хэмжээ: …".

## Data source
Static, from `data.ts` → `partner`.

## Motion notes
- None on the section itself.
- After a CTA scroll lands on the form, the newly selected partner chip shows a brief confirm (a single soft gold flash on that chip), so the user sees their choice was carried over.
- Reduced motion: no flash; the chip is simply selected.

## Acceptance
- [ ] Each CTA preselects the matching form type (0, 1, 2) and focuses Name.
- [ ] CTAs align on one line on desktop whatever the list lengths.
- [ ] Gold text on surface uses gold-700 (5.5:1).
- [ ] Stacked on ≤640px with a hairline between options. Buttons are full width.
- [ ] No promised returns or terms appear unless the owner provided them.
