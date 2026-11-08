# 08 FAQ (`#faq`)

## Purpose
Answer the questions that stop people from sending an inquiry: location, volume, HALAL and export, products, the deck, supplying livestock, visits, and terms.

## Content fields (`data.ts`)
| Key | Type |
|---|---|
| `faq.title`, `faq.more`, `faq.moreLink` | string |
| `faq.items[]` | `{ q: string; a: string }` |

## Copy
| Key | mn | en |
|---|---|---|
| title | Түгээмэл асуулт | Frequently asked questions |
| more | Хариултаа олсонгүй юу? | Can't find your answer? |
| moreLink | Бидэнтэй холбогдоорой | Contact us |

| # | mn | en |
|---|---|---|
| 1 q | Үйлдвэр хаана байрладаг вэ? | Where is the plant? |
| 1 a | Дорнод аймагт, Чойбалсан хотоос зүүн тийш 12 км-т. 2312 м² талбай бүхий үйлдвэр 2020 онд ашиглалтад орсон. | In Dornod Province, 12 km east of Choibalsan. The 2,312 m² plant opened in 2020. |
| 2 q | Хэр хэмжээний мах нийлүүлэх боломжтой вэ? | How much can you supply? |
| 2 a | Үйлдвэр хоногт 500 бог, 300 бод мал төхөөрөх хүчин чадалтай, 500 тонны агуулахтай. Шинэ худалдан авагчид сард нийлүүлэх боломжит хэмжээ: [PLACEHOLDER]. | The plant can slaughter 500 small and 300 large stock a day and holds 500 t in cold storage. Monthly volume available to a new buyer: [PLACEHOLDER]. |
| 3 q | Бүтээгдэхүүн тань HALAL, экспортод тохирох уу? | Is your meat HALAL and export-ready? |
| 3 a | HACCP, HALAL (2023), ISO 9001:2016 (2025) стандартаар баталгаажсан. Экспортын эрхтэй үйлдвэрүүдэд HALAL адууны мах нийлүүлдэг. Шууд экспортын эрх: [PLACEHOLDER]. | We are certified HACCP and HALAL (2023) and ISO 9001:2016 (2025), and we supply HALAL horse meat to export-licensed processors. Direct export licence: [PLACEHOLDER]. |
| 4 q | Ямар бүтээгдэхүүн нийлүүлдэг вэ? | What products do you supply? |
| 4 a | Хонины бүхэл, хагас гулууз, ямааны бүхэл гулууз, үхэр, адууны хагас болон дөрөвний нэг гулууз, тэмээний гулууз (захиалгаар). Бүгд сэрүүн эсвэл хөлдүү. | Whole and half sheep carcasses, whole goat carcasses, half and quarter cattle and horse carcasses, and camel to order — all chilled or frozen. |
| 5 q | Хөрөнгө оруулагчийн танилцуулгыг хэрхэн авах вэ? | How do I get the investor deck? |
| 5 a | Доорх маягтад “Хөрөнгө оруулагч” гэж сонгоод хүсэлтээ илгээнэ үү. Ажлын нэг өдрийн дотор хариу өгнө. [PLACEHOLDER: нууцын гэрээ шаардлагатай эсэх] | Choose “Investor” in the form below and send your request. We reply within one business day. [PLACEHOLDER: whether an NDA is required] |
| 6 q | Би малчин. Танайд мал хэрхэн нийлүүлэх вэ? | I'm a herder. How can I sell livestock to you? |
| 6 a | Бид Дорнод, Сүхбаатар аймгийн малчдаас малыг шууд худалдан авдаг. Хүлээн авахдаа мал эмнэлгийн үзлэг хийж, бичиг баримт бүрдүүлнэ. Маягтад “Мал нийлүүлэгч” гэж сонгох эсвэл +976 9185 3040 дугаарт залгана уу. | We buy directly from herders in Dornod and Sükhbaatar. Animals get a veterinary check and paperwork on intake. Choose “Livestock supplier” in the form or call +976 9185 3040. |
| 7 q | Үйлдвэртэй биечлэн танилцаж болох уу? | Can I visit the plant? |
| 7 a | [PLACEHOLDER] | [PLACEHOLDER] |
| 8 q | Доод захиалга, төлбөр, хүргэлтийн нөхцөл ямар вэ? | What are your minimum order, payment and delivery terms? |
| 8 a | [PLACEHOLDER] | [PLACEHOLDER] |

Notes:
- Answers 5 and 6 refer to form option labels. Keep them identical to `contact.types` (09).
- The phone number in answer 6 should come from `CONTACT.phone` at render time, not as a literal. Use a `{phone}` token replaced in the component.
- The `[PLACEHOLDER]`s come from TODO(owner) 6, 7, 9 and 13. If a placeholder cannot be filled, delete the whole Q&A item rather than shipping a placeholder.

## Interaction
**Native `<details name="faq">`** for each item. Exclusive-open comes for free in current browsers; older ones just allow several open, which is fine. No JS and no library.
| State | Spec |
|---|---|
| Default | Closed. The summary row is ≥56px with the question in h4 serif 22px and a `+` (lucide `Plus`, 18px) on the right. The row has `border-b border-line`. |
| Hover | Question text becomes gold-700. |
| Focus | Gold outline on the summary. |
| Open | The icon rotates to `×`, or swaps to `Minus`. The answer is 15.5px ink/80, max 62ch, with `pb-5`. |
| Empty | With `items: []`, hide the section and remove `#faq` from nav. |

`faq.moreLink` goes to `#contact`, with gold-700 text and an underline.

## Data source
Static, from `data.ts` → `faq`.

## Motion notes
- Opening and closing a question smoothly reveals or collapses the answer height, and the icon turns. Both are short (micro range).
- Reduced motion: instant open and close.

## Acceptance
- [ ] Uses `<details>/<summary>`. Works without JS, by keyboard (Enter/Space) and with screen readers.
- [ ] The first summary is reachable by Tab, and focus is visible.
- [ ] At 390px, long MN questions wrap and the icon stays top-aligned and never shrinks below 18px.
- [ ] No placeholder answer ships (launch gate).
