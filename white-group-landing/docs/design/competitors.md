# Competitor teardown (Revision 2)

Fetched on 2026-11-08 with WebFetch. WebFetch returns the page **text** converted to markdown, not screenshots. Everything below is what that text contains. I could not see visual details such as photo style, colours, font rendering or the mobile layout, so I don't describe them. Where I infer something from a file name, I say so.

| URL | What WebFetch returned |
|---|---|
| https://easymeat.mn/ | Server-rendered, full content |
| https://easymeat.mn/products | Server-rendered. Only the price filter was still client-side ("Loading...") |
| https://www.primeat.mn/mn/s | **Client-rendered. Only the shell came back** (banner, header, footer), with zero products in the HTML |
| https://www.primeat.mn/mn/product/winter-bundle-m | Server-rendered product text. No quantity control or add-to-cart text in the HTML |

---

## 1. Easy Meat (easymeat.mn), operated by "Сүүб" ХХК

### Products, prices, bundles
- **Everything for sale is a bundle (багц).** The home page block "Онцлох бүтээгдэхүүнүүд" and `/products` list the same 5 items:

| Product (verbatim) | Price | ₮/kg (my calculation, not on the site) |
|---|---|---|
| Хонины мах "Хорхог" багц 9кг | 420,000₮ | n/a (includes vegetables, stones, gloves) |
| Хонины мах "Амар" багц 10кг | 290,000₮ | 29,000 |
| Хонины мах "Амар" багц 20кг | 560,000₮ | 28,000 |
| Үхрийн мах "Амар" багц 10кг | 360,000₮ | 36,000 |
| Үхрийн мах "Амар" багц 20кг | 700,000₮ | 35,000 |

- **Weight is part of the product name** ("…багц 10кг"). The listing card shows only the name and price. No per-kg price appears anywhere.
- **The contents are itemised, and the total is stated.** For example, Амар 10 кг: "Нарийн мах – 1 кг", "Машиндсан мах – 2 кг", "Хөрөөдсөн хавирга – 1 кг" … "Хөрөөдсөн булууны яс – 0,5 кг", then "**Нийт: 10 кг**".
- **"Хорхог" is a meal kit, not a weight tier.** It holds 9 kg of mutton plus "Ногооны холимог … 3 кг", seasoning, "Хорхогны тусгай чулуу - 4кг" and gloves.
- The word "идэш" never appears, and nothing is framed as a winter offer.
- Prices are written as `420,000₮`: comma thousands separator and ₮ as a suffix with no space.
- Pay-later is offered through a banner with the button "Зээлээр авах".

### Trust signals
- Trust claims appear **only in product copy**:
  - "Монгол Улсад анхдагч Хүйтэн хэлхээний технологиор боловсруулж, олон улсын HACCP стандартын дагуу савласан"
  - "Монголын үржил шимт бэлчээрийн гарал үүсэл баталгаатай залуу малын мах"
  - No certificate, issuer, year, region or plant is shown to back them.
- A "Харилцагчид" block holds 12 images with no alt text. They are probably partner logos, but I can't confirm that.
- The footer gives the legal name "Сүүб" ХХК, a street address, a phone number, and links to terms, delivery terms, privacy and FAQ.
- There are no reviews and no named customers.

### Photography and typography
I could not observe either. Product front images are PNG files (`new_….png`) with empty alt text, and each card has a second hover image. The Хорхог page has a 9-image gallery, also without alt text.

### Navigation and CTAs
- **Three navigation layers:**
  1. A utility bar: phone, email, "Холбоо барих", FAQ, terms and social links.
  2. A header: "Салбарууд", "Захиалгын явц", "Профайл" and the cart "Таны сагсанд₮".
  3. A category menu "Ангилалууд" (Адуу, Үхэр, Хонь, Ямаа, Багц), plus Брэндүүд, Хямдралтай, Шинээр ирсэн, Онцлох and Блог.
- There is **no hero**. The first block is "Онцлох ангилал" (Үхэр, Хонь, Багц).
- CTAs in the text: "Бүгдийг үзэх", "Холбоо барих" and "Зээлээр авах". The listing text has no add-to-cart label.

### Mobile
Not observable. The collapsible "Ангилалууд" menu is the only hint of a mobile pattern.

### Defects visible in the fetched text
- The home page text contains a raw SQL query ("SELECT * FROM module_product WHERE site_id = ? …").
- The `/products` text contains an API endpoint URL that includes a token.
- In both cases, developer output reaches visitors.

---

## 2. Primeat (primeat.mn)

### Catalogue `/mn/s`
- **Client-rendered.** The heading "Бүтээгдэхүүний хайлтын үр дүн" has no results under it in the HTML. Without JS, or on a slow link before JS runs, the catalogue is empty and there is nothing for search engines to index.
- The promo line "100'000₮ дээш худалдан авалтад хүргэлт үнэгүй" is **repeated about 12 times** in the markup. That pattern usually means a scrolling ticker, but I could not see whether it moves.
- The main nav is Нүүр, Бидний тухай, Бүтээгдэхүүн, Cтэйк лаб, **Subscription** (left in English inside the MN nav), Жор and Ресторан.
- **Icon-only links have no label.** These are cart, account and wallet, plus a second icon-only set (home, catalogue, checkout, account) that looks like a mobile bottom bar. None has a text label or aria-label in the fetched content.
- Footer: Үйлчилгээний нөхцөл, Нууцлалын бодлого, Хүргэлтийн нөхцөл, Дэлгүүрийн байршил, 7773-0000, info@primeat.mn and social links.

### Winter bundle M `/mn/product/winter-bundle-m`
- The name is "**Өвлийн идэш M багц**". The breadcrumb is Нүүр › Бүх бараа › Багц бүтээгдэхүүн › Өвлийн идэш M багц.
- **Block order:**
  1. Gallery (2 images, "1 / 2")
  2. Title
  3. **Price "879,000₮"**
  4. "Гишүүнчлэлийн үнэ 879,000 ₮". This is the same number, this time with a space before ₮.
  5. "Төлбөрийн боломжууд" (Storepay logo only)
  6. "Багцад орсон бүтээгдэхүүнүүд"
  7. Related products
- **The contents list has 16 lines, each with weight, count and sometimes cut size.** Examples: "Хааны цул 3 кг ×1", "Хүзүүний хэрчим (5см) 1 кг", "Хавирга (10-12см) 2 кг", "Машиндсан мах 1 кг ×2". It also includes offal (Элэг, Зүрх, Гүзээ).
- **The page states no total weight.** The lines add up to about 25 kg, which works out to about 35,000₮/kg. Both figures are my calculation.
- **There is a size ladder.** "Winter bundle L" costs 1,639,000₮ (shown in related products, contents not shown). I saw no S size.
- A note says "Өвлийн идэшний багцад гишүүнчлэлийн хөнгөлөлт хамаарахгүй болохыг анхаарна уу." It sits right beside a membership price that equals the normal price.
- The HTML contains **no quantity control and no add-to-cart text**. The control is probably icon-only or rendered by JS, but I can't verify that.
- **No delivery date, delivery area, packaging, frozen or chilled state, origin, farm, HALAL or certification text.** Trust on this page rests on free delivery over 100,000₮ and Storepay.
- Images are `M_bagts_banner.jpg` and `Artboard_1.jpg`. The file names suggest designed banners rather than photographs, but that is an inference.
- Payment is Storepay (pay later). QPay is not mentioned.

---

## 3. Winter bundle presentation side by side

| | Easy Meat "Амар" | Primeat "Өвлийн идэш M" | White Group today (`landing-order.tsx`) |
|---|---|---|---|
| Name pattern | animal + "Амар" + weight | "Өвлийн идэш" + size letter | ERP `name`, verbatim |
| Price | listing + page | page (3 times, once as an identical "membership" price) | card, 22px gold-700, **smaller than the 24px name** |
| Total weight | in the name, and "Нийт" in the contents | **not stated** | **not shown** (computable from ERP `items[].kg`) |
| Itemised contents with kg | yes | yes (+ count, cut size) | yes, but every line always shown |
| ₮/kg | no | no | no |
| Origin at the product | "Монголын бэлчээр" (generic) | none | none. Dornod/Sükhbaatar appears only in other sections |
| Certification at the product | HACCP claim without proof | none | none. HACCP/HALAL/ISO appear only in other sections |
| Delivery terms at the product | footer link | "free ≥100,000₮" banner | **none** ("гэрт тань хүргэнэ" with no area, date or fee) |
| Payment | pay-later loan banner | Storepay | QPay QR + bank deep links (bank links are below the QR on phones) |
| Refund / privacy terms | footer pages | footer pages | **none** |
| Product imagery | PNG front + hover image | designed banners (inferred) | none (the ERP has no image field) |

---

## 4. Lists for White Group

### Borrow
1. **Stated total weight per package.** Easy Meat writes "Нийт: 10 кг"; we compute it from the ERP `items[].kg` for display only.
2. **Contents as a ruled list,** cut name left and kg right (both competitors do this). We keep the list, but cap the visible rows, because Primeat's 16 lines would make the cards very tall.
3. **One plain delivery statement next to the price,** after Primeat's threshold banner. Ours is static text, not a ticker.
4. **A seasonal top strip that names the offer,** after Primeat's banner. One line, static, linking to `#order`.
5. **A single price format: `879,000₮`.** Comma thousands, ₮ suffix, no space. Primeat mixes "879,000₮" and "879,000 ₮".
6. **Terms where you pay.** Both competitors have delivery, refund and privacy pages. We have one static route, so the order section gets inline Q&A instead.
7. **A partner logo strip for the B2B side,** after Easy Meat's "Харилцагчид", once the owner permits logos (TODO 12) and always with alt text.

### Avoid
1. **Shop chrome:** cart page, profile, categories, brands, blog, order tracking. White Group sells a handful of packages on a one-page investor site.
2. **Repeated or marquee banners** like Primeat's line repeated about 12 times. Moving text that can't be paused fails WCAG 2.2.2, and repetition reads as noise.
3. **Two prices that are the same number,** and membership or discount layers in general.
4. **Icon-only navigation without labels** (Primeat).
5. **A catalogue rendered client-only with nothing in the HTML** (Primeat `/mn/s`). Our packages are API-fetched by constraint, so everything else in the order section must be prerendered and give a phone fallback.
6. **Developer output or raw technical errors in front of visitors** (Easy Meat's SQL and token).
7. **Superlatives and certification claims without proof,** such as "Монгол Улсад анхдагч" or HACCP with no issuer or year.
8. **Untranslated labels in the MN interface** (Primeat's "Subscription").
9. **Images without alt text** (both competitors).

### Differentiate (White Group is the processor)
1. **Named origin instead of "pasture".** White Group buys directly from herders in Dornod and Sükhbaatar. Neither competitor names a region. Say it at the price, not three sections away.
2. **Proof of the plant.** Neither competitor shows where or how its meat is processed. White Group's explorer does: a 142 m line, 500 small and 300 large stock a day, a 500 t store. So the order section should sit **right after the explorer**: proof first, then price.
3. **HALAL.** Neither competitor mentions it. White Group has been certified since 2023, holds HACCP (2023) and ISO 9001:2016 (2025), and lists them with years (and PDFs once supplied).
4. **Real, unedited plant photography** against designed banners and packshots. Use `storage.jpg` (a worker carrying a packed sack out of the cold store) in the order section until a real package photo exists.
5. **Total weight on every card.** Primeat states none and neither competitor shows ₮/kg. Showing ₮/kg is the owner's call (brief TODO 21).
6. **One page serving buyers and investors.** Buyers see a company with a plant, not just a shop. Investors see a working direct-to-consumer channel with real orders and QPay.
