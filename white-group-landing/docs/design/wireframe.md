# Wireframes

Desktop is the 1200px container. Mobile is ≤390px with 20px gutters. Mongolian, the longer language, is shown in every frame.

Key:
- `[ Button ]` button
- `( chip )` chip
- `(o)` node · `(●)` active node
- `━` solid gold rule · `─ ─` dashed
- `┃` hairline divider
- `▸/▾` disclosure
- `plate:` matted photo, **natural, no filter**
- `<…>` value from the ERP API

## Revision 2 changes
| Change | Reason |
|---|---|
| Seasonal strip above the hero | Primeat leads with an offer banner, and retail visitors need a one-tap path to `#order`. Ours is static, not repeated, not sticky. |
| Hero gets back its investor CTA | The brief's second CTA is missing from the built hero. |
| **03b Winter order moves to directly after 03 Explorer** and gets its own frame | Competitors show price without provenance; the explorer is our provenance. Investor screens 1–2 also stay clean. |
| Order card: price is the largest text, total kg is shown, items are capped at 6, "Сонгох" replaces the bare stepper at 0, selected edge + ✓ tag | Competitor bundles anchor on price and weight. Primeat's 16-line contents would make our cards about 3 screens tall. A bare `[−] 0 [+]` doesn't say "pick me". |
| Sticky summary bar (CSS sticky inside the order section) | No cart exists, and on a phone the form sits below every card. |
| Pay state on mobile: bank apps before the QR (QR moves last) | The same phone can't scan its own screen. |
| Explorer rail: no visible scrollbar. Specs table: no horizontal scroll | Owner rule. |
| Photos: "graded" removed everywhere | Owner rule. |

Page order and anchors:

| # | Section | Anchor | Background |
|---|---|---|---|
| — | Seasonal strip (only while `order.strip` ≠ "") | links to `#order` | surface |
| 01 | Hero | `#top` | photo (natural) + night overlay |
| 02 | Key numbers | `#numbers` | paper |
| 03 | Business model explorer | `#model` | **night-deep (the one bold section)** |
| 03b | **Winter order** | `#order` | paper |
| 04 | Market opportunity | `#market` | paper |
| 05 | Growth roadmap | `#roadmap` | paper |
| 06 | Partnership options | `#partner` | surface |
| — | Partner/return calculator | — | **skipped** (see brief, "Out of scope") |
| 07 | Team & trust | `#team` | night-deep founder band → paper |
| 08 | FAQ | `#faq` | paper |
| 09 | Inquiry form | `#contact` | paper |
| 10 | Footer | — | night-deep |

Neighbouring paper sections are separated by `<hr class="border-line">` (03b→04, 04→05, 08→09).

---

## Header (sticky) and seasonal strip
Desktop ≥1280px:
```
+--------------------------------------------------------------------------------------------------+
| [mark] ВАЙТ ГРУПП  Бизнес загвар  Захиалга  Зах зээл  Замнал  Хамтын ажиллагаа  Баг  Асуулт  [МН|EN] [ Хамтарч ажиллах ] |
|        WHITE GROUP LLC                                                                            |
+--------------------------------------------------------------------------------------------------+
|            Өвлийн идэшний захиалга нээлттэй — багц, үнийг үзэх →                                  |  strip: bg-surface, 44px,
+--------------------------------------------------------------------------------------------------+  NOT sticky, static text
```
Below 1280px and on mobile:
```
+--------------------------------------+
| [mark] ВАЙТ ГРУПП    [МН|EN]  [≡]    |   sticky, all controls 44px
+--------------------------------------+
| Өвлийн идэшний захиалга нээлттэй —   |   strip wraps to 2 lines,
| багц, үнийг үзэх →                   |   scrolls away with the page
+--------------------------------------+
  [≡] opens the Sheet: 7 links (52px rows) + [ Хамтарч ажиллах ] full width
```

---

## 01 Hero
Desktop:
```
+==============================================================================+
| full-bleed photo /photos/cold-room.jpg, NATURAL (no grade); night overlay    |
| darkens toward the bottom                                                    |
|                                                                              |
|  Дорнод аймаг · 2008 оноос              ← gold-400, 13px, sentence case      |
|                                                                              |
|  Зүүн талын бэлчээрээс                  ← display serif, paper               |
|  таны агуулах хүртэл.                                                        |
|                                                                              |
|  “Вайт грүпп” ХХК нь Дорнод, Сүхбаатар нутгийн бэлчээрийн малыг …            |
|  … Бидэнтэй хамтран өсөх түнш, хөрөнгө оруулагчдыг урьж байна.  ← 58ch       |
|                                                                              |
|  [ Хамтарч ажиллах ]   [ Хөрөнгө оруулагчийн танилцуулга хүсэх ]             |
|   gold-300 outline       paper/40 outline (restored)                         |
|  ─────────────────────────────────────────────── paper/22 rule               |
|  HACCP   HALAL   ISO 9001:2016                                               |
+==============================================================================+
```
Mobile:
```
+--------------------------------------+
| photo (natural)                      |
| Дорнод аймаг · 2008 оноос            |
| Зүүн талын                           |
| бэлчээрээс                           |   40px display
| таны агуулах                         |
| хүртэл.                              |
| sub 16.5px …                         |
| [        Хамтарч ажиллах          ]  |   full width, 48px
| [ Хөрөнгө оруулагчийн танилцуулга ]  |   full width, wraps
| [            хүсэх                ]  |
| HACCP  HALAL  ISO 9001:2016          |
+--------------------------------------+
```

---

## 02 Key numbers
Unchanged layout. Rev 2: the first cell reads **18** (computed from 2008).
```
| Гол үзүүлэлтүүд                                                              |
|──────────────────┬──────────────────┬──────────────────┬─────────────────────|
| 18               | 500              | 300              | 500 т               |
| жил салбартаа    | бог мал хоногт … | бод мал хоногт … | хөлдүү махны агуулах|
|──────────────────┼──────────────────┼──────────────────┼─────────────────────|
| 2312 м²          | 10+              | [PLACEHOLDER]    | [PLACEHOLDER]       |
|──────────────────┴──────────────────┴──────────────────┴─────────────────────|
| footnote 12.5px ink/70                                                       |
```
Mobile: 2 columns, same cells.

---

## 03 Business model explorer (the bold section)
Desktop is unchanged from v1:
```
+================================================================================+  bg-night-deep
|  Бизнес загвар                                         Малын төрөл             |
|  Бэлчээрээс худалдан авагч хүртэл   (h2)               ( Бог мал | Бод мал )   |
|  sub                                                                           |
|  Эх үүсвэр  ┊ Үйлдвэр ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ┊ Зах зээл     |
|  (o)━━━━━━━━━━(o)━━━━━━━━━━(●)─ ─ ─ ─ ─(o)─ ─ ─ ─ ─(o)─ ─ ─ ─ ─(o)─ ─ ─ ─ ─(o)   |
|  01           02           03          04          05          06          07  |
|  Бэлчээр   Хүлээн авалт  Төхөөрөлт    Задлах     Хөлдөөх     Агуулах  Худалдан   |
|                                                                     авагч      |
|  +-------------------------------------+    03 / 07                            |
|  | plate 4:3 (natural photo / map /    |    Төхөөрөлт                          |
|  |  blurred gate on stop 3)            |    body · facts dl · partner line     |
|  +-------------------------------------+    [‹ Өмнөх]  [Дараах ›]             |
|  ▸ Үйлдвэрийн бүх үзүүлэлт                                                     |
|    Хэсэг                  Хэмжээ        Хүчин чадал    ← Rev 2: table wraps,   |
|    Задлан, нядалгааны …   12×40 м       —                 never scrolls x      |
+================================================================================+
         ↓ the order section follows immediately
```
Mobile:
```
+======================================+
| Бизнес загвар                        |
| Бэлчээрээс худалдан авагч хүртэл     |
| ( Бог мал        |  Бод мал        ) |
| (o)━(o)━(●)─(o)─(o)─(o)─(o)          |   rail scrolls x, Rev 2: NO visible
|  01  02  03  04  05  06  07          |   scrollbar; active stop centred,
|   Төхөөрөлт                          |   next stop cut at the edge
| +----------------------------------+ |
| | media 4:3                        | |
| +----------------------------------+ |
| 03 / 07 · title · body · facts       |
| [ ‹ Өмнөх ]        [ Дараах › ]      |
| ▸ Үйлдвэрийн бүх үзүүлэлт            |
|   Задлан,       12×40 м   —          |   cells wrap, 14px
|   нядалгааны                         |
|   хэсэг                              |
+======================================+
```

---

## 03b Winter order (new frame, Revision 2)
Desktop, default state:
```
+--------------------------------------------------------------------------------+  bg-paper
| Өвлийн идэшээ захиалаарай (h2, no kicker)       | plate /photos/storage.jpg 4:3 |
| Малчдаас шууд бэлтгэж, стандартын дагуу          | natural; worker carrying a    |
| төхөөрсөн махыг багцаар нь … QPay-ээр төлнө.     | packed sack out of the cold   |
|                                                 | store. lg+ only               |
| ─────────────────────────┬───────────────────── |                               |
| Гарал үүсэл              │ Боловсруулалт        |                               |
| Дорнод, Сүхбаатарын      │ Өөрийн үйлдвэрт ·    |                               |
| малчдаас шууд            │ HALAL, HACCP, ISO 9001|                              |
| ─────────────────────────┼───────────────────── |                               |
| Хүргэлт                  │ Төлбөр               |                               |
| [PLACEHOLDER: бүс, …]    │ QPay, банкны аппаараа|                               |
| ─────────────────────────┴───────────────────── |                               |
+--------------------------------------------------------------------------------+
| +--------------------------+ +==========================+ +--------------------------+
| | <name>          (h3 24)  | | <name>                   | | <name>                   |
| | <price>₮        (30 ink) | | <price>₮                 | | <price>₮                 |
| | Нийт <kg> кг (15 ink/70) | | Нийт <kg> кг             | | (no total: an item kg is |
| | <description>            | | <description>            | |  null → line hidden)     |
| | ──────────────────────── | | ──────────────────────── | | ──────────────────────── |
| | <item>          <kg> кг  | | <item>          <kg> кг  | | <item>                   |
| | <item>          <kg> кг  | | …  (max 6 rows)          | | <item>          <kg> кг  |
| | …  (max 6 rows)          | | ▸ Бусад 10 зүйл           | |                          |
| |                          | |                          | |                          |
| | [        Сонгох        ] | | [−]  1  [+]  (✓ Сонгосон)| | [        Сонгох        ] |
| +--------------------------+ +==========================+ +--------------------------+
|                                ▲ selected: 2px gold-600 edge + ✓ tag            |
|████ Багц: 1 · <total>₮                                       [ Захиалах ↓ ] ████|  sticky bar, bg-ink, 56px
| +-----------------------------------------------------------------------------+ |  id=order-form
| | Таны захиалга (h3)                   │ Нэр *              │ Утас *            | |
| | 1 × <name>               <price>₮    │ Хүргэлтийн хаяг *                      | |
| | ──────────────────────────────────── │ Нэмэлт тайлбар (заавал биш)            | |
| | Нийт                     <total>₮    │ [   QPay-ээр төлөх · <total>₮       ]  | |
| |                                      │ Таны нэр, утас, хаягийг зөвхөн …       | |
| +-----------------------------------------------------------------------------+ |
| ▸ Хүргэлт хэзээ, хаана хийгдэх вэ?                                          [+] |
| ▸ Захиалгаа цуцалж, төлбөрөө буцааж авч болох уу?                           [+] |
+--------------------------------------------------------------------------------+
```
Mobile, default state:
```
+--------------------------------------+
| Өвлийн идэшээ                        |
| захиалаарай                          |
| sub                                  |
| ─────────────────┬────────────────── |
| Гарал үүсэл      │ Боловсруулалт     |   2×2 facts, values wrap
| Дорнод,          │ Өөрийн үйлдвэрт · |
| Сүхбаатарын …    │ HALAL, HACCP, …   |
| ─────────────────┼────────────────── |
| Хүргэлт          │ Төлбөр            |
| [PLACEHOLDER]    │ QPay, банкны …    |
| (no photo below 1024px)              |
| +----------------------------------+ |
| | <name>                           | |
| | <price>₮                         | |
| | Нийт <kg> кг                     | |
| | <item>                   <kg> кг | |
| | <long item name that             | |
| |  wraps>                  <kg> кг | |   kg never wraps (shrink-0)
| | ▸ Бусад 10 зүйл                  | |   44px summary
| | [           Сонгох             ] | |   48px
| +----------------------------------+ |
| +----------------------------------+ |
| | …                                | |
|██ Багц: 1 · <total>₮  [Захиалах ↓] ██|   pinned to the viewport bottom while
| +----------------------------------+ |   the cards scroll; settles here
| | Таны захиалга                    | |
| | 1 × <name>             <price>₮  | |
| | Нэр *                            | |   48px fields, single column
| | Утас *                           | |
| | Хүргэлтийн хаяг *                | |
| | Нэмэлт тайлбар                   | |
| | [  QPay-ээр төлөх · <total>₮  ]  | |
| | privacy line                     | |
| +----------------------------------+ |
| ▸ Хүргэлт хэзээ, хаана …         [+] |
| ▸ Захиалгаа цуцалж, …            [+] |
+--------------------------------------+
```
Mobile, pay state (CSS reorder only, `max-md:order-last` on the QR; the flow is unchanged):
```
+--------------------------------------+
| QPay-ээр төлнө үү                    |
| Банкны аппаараа …                    |
| Захиалгын дугаар   <code>            |
| Нийт               <total>₮          |
| [<bank>] [<bank>] [<bank>]           |   bank deep links FIRST, 44px
| [<bank>] [<bank>] [<bank>]           |
| Төлбөр хүлээж байна…                 |
| [ Төлбөр шалгах ]  [ Буцах ]         |
| +------------+                       |
| |  QR 200px  |                       |   QR last (for scanning from a second device)
| +------------+                       |
+--------------------------------------+
```
Load error or empty (prerendered head and facts stay above):
```
| ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  |
|   Багцуудыг ачаалж чадсангүй. …       |
|   Утсаар захиалах: +976 9185 3040     |   tel: link, 44px
| └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  |   dashed frame, min-h 240px
```

---

## 04 Market opportunity
Unchanged.
```
| Зах зээлийн боломж (h2)          │  [PLACEHOLDER]    │  [PLACEHOLDER]    │  [PLACEHOLDER]    |
| sub, max 40ch                    │  сая толгой мал,  │  сая толгой мал,  │  мян. тонн мах    |
|                                  │  Монгол улс       │  Дорнод ба …      │  экспортолсон …   |
|                                  │  Эх сурвалж: …    │  Эх сурвалж: …    │  Эх сурвалж: …    |
|──────────────────────────────────────────────────────────────────────────────────────────|
| Бидний давуу тал (h3)                                                                     |
| Гарал үүсэл тодорхой           ┃ Олон улсын стандарт          ┃ Нэг дээвэр дор            |
```
Mobile: stacked.

---

## 05 Growth roadmap
Unchanged layout (the rail already has no scrollbar). Rev 2 colour note: the active year numeral uses **gold-700**, because gold is 2.6:1 on the current paper. Planned years are gold-700 italic, with no opacity.
```
| Замнал ба төлөвлөгөө (h2)                         2008 оноос хийж ирсэн ажил, …             |
| 2008  2010  2014  2017  2020  2021  2022  2023  2024  2025 ┆Өнөөдөр┆ [PH]   [PH]   [PH]      |
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┆─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  |
| 2025                    ISO 9001:2016 чанарын менежментийн …         ( Хэрэгжсэн )         |
```
Mobile: the rail scrolls x with no scrollbar and the detail stacks below.

---

## 06 Partnership options
Unchanged (surface band, three ruled columns, the `cutting-team.jpg` plate shown natural).

---

## 07 Team & trust
Unchanged layout. Rev 2 colour note: the 40px cert names move from `text-gold` (2.6:1) to `text-gold-700` (5.1:1). A partner logo row (Easy Meat's "Харилцагчид" pattern) replaces the text names **only** if the owner permits logos (TODO 12), with alt = the name.

---

## 08 FAQ
Unchanged. The retail order questions live in 03b, not here, so the investor FAQ stays focused.

---

## 09 Inquiry form
Unchanged layout. Global Rev 2 effect: autofilled fields keep the paper background (tokens, Glare 3).

---

## 10 Footer
Unchanged. The nav column follows the new `t.nav` order, so "Захиалга" comes after "Бизнес загвар".
