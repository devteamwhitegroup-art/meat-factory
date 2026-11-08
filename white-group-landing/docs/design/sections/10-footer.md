# 10 Footer

## Purpose
Close with identity and credentials, and give direct contact and navigation, so nobody reaches the bottom of the page without a way to act.

## Content fields (`data.ts`)
| Key | Status |
|---|---|
| `footer.blurb`, `footer.copy`, `footer.places` | existing, keep |
| `footer.regNo` | new |
| `nav` | reused (new anchors from 01) |
| `CERTS`, `CONTACT` | existing consts |
| Logo | `/brand/mark-white.png` (existing) |

## Copy
| Key | mn | en |
|---|---|---|
| blurb | existing | existing |
| copy | existing (© 2026 …) | existing |
| places | Дорнод · Сүхбаатар · Улаанбаатар (existing) | Dornod · Sükhbaatar · Ulaanbaatar (existing) |
| regNo | Улсын бүртгэлийн дугаар: [PLACEHOLDER] | Company registration no.: [PLACEHOLDER] |
| contact column | `CONTACT.phone`, `CONTACT.email`, `contact.addr` (reused) | same |

`regNo` comes from TODO(owner) 16. If the owner prefers not to show it, delete the key and its render.

## Interaction
| Element | States |
|---|---|
| Nav and contact links | Default paper/82. Hover gold-300. Focus outline. Each link gets `py-2`, so the target is ≥44px tall on mobile |
| Cert tags | Static |

## Layout rules
- Existing footer markup. Add a third column (contact). Columns wrap with `flex-wrap`.
- Bottom row: copyright · regNo on the left, places on the right. Wraps on mobile.

## Data source
Static, from `data.ts`.

## Motion notes
None.

## Acceptance
- [ ] Nav matches the header's 6 anchors.
- [ ] Phone and email are live `tel:` and `mailto:` links.
- [ ] Contrast on night-deep: links paper/82, small print ≥ paper/62.
- [ ] Every link target is ≥44px tall at 390px.
