# 09 Inquiry form (`#contact`)

## Purpose
Capture a qualified inquiry (partner type, who, how to reach them) in under a minute on a phone, and be honest about how it is delivered.

## Content fields (`data.ts` → `contact`)
| Key | Status |
|---|---|
| `title`, `phoneL`, `emailL`, `addrL`, `addr`, `formTitle`, `fContact`, `fMsg`, `send` | **existing, keep** |
| `sub` | rewritten |
| `fType`, `types[4]` | replace `fBuyer`, `buyers[4]` |
| `fName`, `fCompany`, `optional`, `requiredSr`, `fBudget`, `budgets[]`, `msgHint`, `sendNote` | new |
| `errType`, `errName`, `errContact` | new |
| `openedTitle`, `openedBody`, `back`, `mailSubject` | new. Replace `thanks`, `thanksBody`, `again`, which claimed receipt that never happened |
| `CONTACT` | existing const (phone, phoneHref, email) |

## Copy
| Key | mn | en |
|---|---|---|
| title | Хамтран ажиллахад бэлэн (existing) | Ready to work together (existing) |
| sub | Хамтын ажиллагаа, хөрөнгө оруулалт, нийлүүлэлтийн талаар бидэнтэй холбогдоорой. Ажлын нэг өдрийн дотор хариу өгнө. | Get in touch about partnership, investment or supply. We reply within one business day. |
| formTitle | Хүсэлт илгээх (existing) | Send a request (existing) |
| fType | Та хэн бэ? | You are |
| types | Хөрөнгө оруулагч · Худалдан авагч, түгээгч · Мал нийлүүлэгч · Бусад | Investor · Buyer or distributor · Livestock supplier · Other |
| fName | Нэр | Name |
| fCompany | Байгууллага | Company |
| optional | заавал биш | optional |
| requiredSr | заавал бөглөнө | required |
| fContact | Утас эсвэл и-мэйл (existing) | Phone or email (existing) |
| fBudget | Төсөв / захиалгын хэмжээ | Budget or order size |
| budgets | Сонгоогүй · [PLACEHOLDER] · [PLACEHOLDER] · [PLACEHOLDER] · Хэлэхийг хүсэхгүй | Not selected · [PLACEHOLDER] · [PLACEHOLDER] · [PLACEHOLDER] · Prefer not to say |
| fMsg | Захиалга / зурвас (existing) | Order / message (existing) |
| msgHint | Жишээ нь: сонирхож буй бүтээгдэхүүн, хэмжээ, хугацаа | For example: products, volumes and timing you have in mind |
| send | Илгээх (existing) | Send (existing) |
| sendNote | “Илгээх” дарахад таны и-мэйл программ бэлэн зурвастай нээгдэнэ. | “Send” opens your email app with the message ready to go. |
| errType | Та хэн болохоо сонгоно уу. | Please choose who you are. |
| errName | Нэрээ оруулна уу. | Please enter your name. |
| errContact | Зөв и-мэйл хаяг эсвэл утасны дугаар оруулна уу. | Enter a valid email address or phone number. |
| openedTitle | И-мэйл программ нээгдлээ | Your email app should now be open |
| openedBody | Зурвасаа тэндээс илгээнэ үү. Программ нээгдээгүй бол {email} хаягаар шууд бичих эсвэл {phone} дугаарт залгана уу. | Send the message from there. If nothing opened, write to {email} or call {phone}. |
| back | Маягт руу буцах | Back to the form |
| mailSubject | Хамтын ажиллагааны хүсэлт — {type} | Partnership inquiry — {type} |

The budget brackets come from TODO(owner) 15. The delivery method comes from TODO(owner) 14.

## Fields
| Field | Control | Required | Rule |
|---|---|---|---|
| Partner type | native radios styled as chips (`<fieldset><legend>`) | yes | one of 4. Preselected by CTAs via lifted state; otherwise none |
| Name | `<input autocomplete="name">` | yes | trimmed length ≥ 2 |
| Company | `<input autocomplete="organization">` | no | max 120 |
| Phone or email | `<input autocomplete="email" inputmode="email">`* | yes | valid if it matches `^[^\s@]+@[^\s@]+\.[^\s@]+$` **or** has ≥ 8 digits after stripping non-digits |
| Budget / order size | native `<select>` | no | first option = "not selected" (value "") |
| Message | `<textarea rows=4>` | no | `maxLength=1500`, which keeps the mailto URL under client limits |

\* Mixed field: use `inputmode="email"`, because it still shows digits on most mobile keyboards. Do not use `type="email"`, because it would reject phone numbers.

## Delivery (default, no backend)
On a valid submit:
1. Build `mailto:${CONTACT.email}?subject=…&body=…` with `encodeURIComponent`. The subject is `mailSubject` with `{type}`. The body has one line per field, labelled in the **active** language, with empty optional fields omitted.
2. Run `window.location.href = url`.
3. Switch the card to the **opened** state.

The form never says "received". The form values are **kept**: "Back to the form" restores them untouched, so nothing is lost if no mail app opened.

A honeypot or rate limit is not needed for mailto, because no server receives anything. If the owner later picks a form service or route handler (TODO 14), add both at that point.

## Interaction and states
| State | Spec |
|---|---|
| Default | Card `.card p-8` (the only card on the page; it marks the form boundary). Inputs `.input` + `border-ink/50` (tokens fix 2), `min-h-12` (48px), 16px font so iOS does not zoom. |
| Hover | Input border is ink/70. A chip shows a gold/6 fill. |
| Focus | Gold border + the global focus outline. A chip shows the outline around the chip (the radio is visually hidden, not `display:none`). |
| Active / selected chip | Gold border, gold/10 fill, gold-700 text, and a ✓ icon (lucide `Check`, 14px) so selection is not shown by colour alone. |
| Error | Validated on submit, then each field again on blur. The field gets `aria-invalid="true"` + `aria-describedby` → message `<p>` in `text-destructive` 13.5px with a lucide `AlertCircle` 14px. **Focus moves to the first invalid field.** The partner-type error sits under the legend. Errors clear as the user fixes the field. Messages come from `data.ts`, never from the browser (`noValidate` on the form), so they follow the MN/EN toggle. |
| Loading | Does not apply (mailto is instant). The button only shows its pressed state. |
| Opened | Replaces the form inside the same card at the same min-height, so there is no layout jump. ✓ icon, `openedTitle` (h3), `openedBody` with live `mailto:` and `tel:` links, and `[Маягт руу буцах]` (`.btn-ghost`). Focus moves to the `openedTitle` (`tabIndex=-1`). |
| Language switch mid-form | Values persist, and labels, errors and option text switch language. |

Contact list (left on desktop, **after** the form on mobile): existing phone (`tel:`), email (`mailto:`) and address rows. The phone row is the biggest tap target on mobile (≥48px).

## Layout rules
- Desktop: 2 columns. The left has the h2, sub and contact list. The right has the form card. Name and Company sit side by side at ≥640px.
- Mobile: h2 → sub → form → contact list (CSS grid areas; DOM order = h2, sub, form, contacts).
- The section keeps `id="contact"` and `scroll-mt-20` (sticky header).

## Data source
Static copy from `data.ts` → `contact`, `CONTACT`. Partner type state is lifted to `src/app/page.tsx` (see handoff).

## Motion notes
- The error message fades in quickly, without shake.
- The swap from form to opened state is a short crossfade in place, with no height jump.
- When the type is preselected by a CTA, the selected chip gets one soft confirm flash (see 06).
- Reduced motion: no fades, instant swap.

## Acceptance
- [ ] Fields exactly as in the role spec: partner type, name, company, email/phone, budget range (optional), message.
- [ ] Submitting empty shows 3 bilingual errors and focuses the partner type.
- [ ] `+976 9185 3040`, `91853040` and `a@b.mn` pass; `abc` and `1234` fail.
- [ ] A valid submit opens the mail client with subject and body in the active language, and shows the opened state. "Back" restores every value.
- [ ] Usable at 390px with one hand: 48px inputs, 44px chips, no horizontal scroll, and no zoom on focus.
- [ ] Field borders are ≥3:1, error text is 5.9:1, and focus is always visible.
- [ ] Works with JS enabled. With JS disabled, the contact list (tel and mailto) still works. That is an acceptable fallback for a static page.
