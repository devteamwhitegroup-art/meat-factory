# Brief: White Group investor & partner landing page

## TODO(owner): answer before launch
Every `[PLACEHOLDER]` on the page traces back to one of these. None of these values were made up. If a question has no answer by launch, delete the entry it feeds (each section spec says what happens when its list is empty).

1. **Annual output and revenue.** How many tonnes of meat do you process a year, and what is annual revenue (MNT)? What year are the figures from? These feed the Key numbers section (02).
2. ~~"17 years".~~ Revision 2: the number is now computed from 2008, so it shows 18 in 2026. No answer needed unless you prefer counting from 2010.
3. **Market figures with sources.** We need the national livestock headcount, the Dornod + Sükhbaatar headcount, and annual meat exports, each with a source and year (for example NSO / 1212.mn). Without sources, section 04 should be dropped.
4. **Roadmap from 2026 on.** List the next 2–4 milestones (for example capacity expansion, a direct export licence, new products), each with a year and status.
5. **The investment ask.** What amount range, for what use of funds, and in what structure (equity, loan, JV)? Should any return figures be public, or only in the deck? We recommend the deck only.
6. **Investor deck.** Does it exist? In which languages? Is an NDA required? Who sends it?
7. **Buyer terms.** Minimum order, payment and delivery terms, delivery area, and the monthly volume a new buyer can get.
8. **Supplier terms.** Which seasons and months you buy livestock, typical head counts, and payment terms for herders.
9. **Export.** Does White Group hold a direct export licence, or does it only supply export-licensed processors? Which markets does the horse meat reach?
10. **Team.** Founder name, quote and story, plus 2–3 leaders with name, role and a one-line bio. Photos are optional.
11. **Certificates.** Issuing body for HACCP, HALAL and ISO 9001, and validity dates. Can we publish the certificate scans as PDFs? *Revision 2: this is now high value. Neither competitor shows any proof of certification.*
12. **Partner logos.** May we show the Trust Trade and Makh Impex logos? Until then they appear as text names.
13. **Plant visits.** Are investor and buyer visits possible? On what notice?
14. **Inquiry delivery.** The inquiry form opens the visitor's email app pre-filled to info@whitegroup.mn. Is that acceptable, or do you want a form service? Should investor mail go to a separate address?
15. **Budget ranges** for the form's optional "Budget / order size" select: currency (MNT or USD) and 3–4 brackets.
16. **Legal line.** The company registration number for the footer. Investors look for it, and both competitors show their legal entity in the footer.
17. **Videos.** Are hero, slaughter or freezing clips available? `VIDEOS` in `data.ts` is still empty.

### Revision 2: winter order (`#order`)
18. **Delivery for winter packages.** Which area (Ulaanbaatar? Choibalsan? other aimags?), how many days after payment, and what fee? This feeds the "Хүргэлт" fact and the first order Q&A. Today the page promises "гэрт тань хүргэнэ" with no area, date or fee. Primeat at least states free delivery over 100,000₮.
19. **Cancellation and refund.** Can a paid order be cancelled, and how is the money returned? This feeds the second order Q&A. Competitors publish delivery, refund and privacy terms; we publish none while taking payment.
20. **Season dates.** When does online ordering open and close? The strip above the hero ("Өвлийн идэшний захиалга нээлттэй…") should be cleared (`order.strip = ""`) when it closes.
21. **Weight and ₮/kg on the cards.** We will show each package's total weight, computed from the kg you enter per item in the ERP; neither competitor does this consistently. Should we also show the price per kg? For reference, Easy Meat is about 28,000–36,000₮/kg and Primeat's "Өвлийн идэш M" about 35,000₮/kg (our calculation from their listed weights). Default: total weight yes, ₮/kg no.
22. **A real package photo.** A natural, unedited photo of a packed winter package (or a few cuts laid out) would replace the stand-in `storage.jpg` in the order section. Competitors use designed banners; a real photo is our advantage.
23. **Privacy line.** OK to state under the pay button: "Таны нэр, утас, хаягийг зөвхөн энэ захиалгыг хүргэхэд ашиглана." ("We use your name, phone and address only to deliver this order.")?
24. **Package names in the ERP.** The card shows the ERP name verbatim. A consistent pattern helps people compare, e.g. animal + weight ("Хонины идэш · 20 кг") or a size ladder (M / L, as Primeat does).
25. **Pay later (not in this revision).** Both competitors offer it (Storepay; Easy Meat's "Зээлээр авах"). Adding it would change the ERP payment flow, which is out of scope here. Tell us if you want it later.

## What White Group is
Source: `src/components/landing/data.ts` and `landing-order.tsx`. These are facts only, nothing added.
- "Вайт грүпп" ХХК / White Group LLC is a meat processor in Dornod Province, Mongolia, **12 km east of Choibalsan**.
- **Since 2008** it has sourced raw materials. **Since 2010** it has supplied livestock, meat and animal products to the domestic market steadily.
- Livestock is bought **directly from herders in Dornod and Sükhbaatar**.
- The **plant opened in 2020**:
  - 2,312 m² floor area
  - a 142 m slaughter line handling 500 small + 300 large stock per day
  - 2 × 20 t chilling halls and 5 × 40 t freezer rooms
  - a 500 t cold store
  - a 12×40 m cutting hall and 2 deboning rooms
- **Products:** sheep, goat, cattle, horse and camel carcasses, chilled or frozen. HALAL horse meat goes to export-licensed processors.
- **Online retail:** winter meat packages are sold on this page. Packages and prices come from the company ERP, and payment is by QPay.
- **Certifications:** HACCP (2023), HALAL (2023), MNS ISO 9001:2016 (2025).
- **Milestones:**
  - 2014: Trust Trade, Makh Impex and about 10 Ulaanbaatar companies.
  - 2017: Choibalsan schools, kindergartens and the Eastern Region Diagnostic & Treatment Center.
  - 2021: Ulaanbaatar reserve-meat tender.
  - 2022: heat-processing workshop.
  - 2024: by-products plant.
- **People:** 30 permanent and 20–30 seasonal jobs.
- **Contact:** +976 9185 3040 · info@whitegroup.mn.

## Audience
| Who | What they need to see | Language and device |
|---|---|---|
| **Investors** (Mongolian and foreign) | Track record, real capacity, certifications, named buyers, a credible plan, the people behind it, a way to get the deck | EN as much as MN; desktop first |
| **Distribution partners / buyers** (UB wholesalers, export-licensed processors, institutions) | Products, volumes, HALAL, cold chain, terms, quick quote | Mostly MN; desktop and mobile |
| **Suppliers** (herders and cooperatives) | That we buy directly, how intake works, whom to call | MN only; **mobile, slow rural connection** |
| **Households buying winter meat** (Rev 2) | Price, weight, what's inside, where it's from, when it arrives, how to pay | MN; **mobile first**, often arriving from a social media link |

## Primary job of the page
Turn a visit into a **qualified inquiry**: someone who has said what kind of partner they are. A tap-to-call is the second-best result. During the season, a **paid winter order** is an equal outcome for household visitors, and it also shows investors a working direct-to-consumer channel.

## CTAs
| CTA | mn | en | Goes to |
|---|---|---|---|
| Primary (header + hero) | Хамтарч ажиллах | Become a partner | `#contact`, no type preselected |
| Investor (hero + section 06) | Хөрөнгө оруулагчийн танилцуулга хүсэх | Request the investor deck | `#contact`, type = Investor |
| Buyer (section 06) | Үнийн санал авах | Request a quote | `#contact`, type = Buyer / distributor |
| Supplier (section 06) | Мал нийлүүлэх | Offer livestock | `#contact`, type = Livestock supplier |
| Seasonal (strip + nav, Rev 2) | Өвлийн идэшний захиалга нээлттэй — багц, үнийг үзэх | Winter meat orders are open — see packages and prices | `#order` |
| Fallback (form, footer, FAQ, order errors) | phone `tel:` + `mailto:` | same | direct |

## Tone
Plain, factual and calm. The facts carry the trust. No hype, no promised returns, no superlatives we can't prove (unlike competitors' "Монгол Улсад анхдагч"). Copy speaks as "we". Mongolian is the source language.

## Out of scope
- **Partner/return calculator.** It needs owner financials (TODO 1, 5).
- `/en` route and hreflang, a CMS, and a backend of our own. The order section talks to the ERP's public GraphQL; that fetch, `createOrder` and the QPay flow are owned by another session and are not redesigned here.
- Shop features: cart page, accounts, categories, membership pricing (see `competitors.md`, Avoid).
