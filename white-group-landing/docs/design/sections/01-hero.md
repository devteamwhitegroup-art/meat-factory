# 01 Hero (`#top`), plus header and seasonal strip

## Revision 2 changes
| Change | Reason |
|---|---|
| **Restore the investor CTA** `hero.ctaDeck` next to the primary CTA | The brief names "Contact for investor deck" as one of the page's two CTAs, but the built hero has only `cta`, so the deck request first appears in section 06, about 6 screens down. |
| **Add a seasonal strip above the hero** (`order.strip`, static, one line, links to `#order`) | Primeat leads with a delivery/offer banner. Retail visitors from ads need a one-tap path, because the order section moves below the explorer (see 03b). Ours is static, not repeated, and never a ticker. |
| **Nav order follows page order**: `#order` moves after `#model` | The order section moves after the explorer, and the nav should mirror the page. |
| **Hero kicker: drop `uppercase`** | Uppercase Cyrillic with 0.14em tracking runs ~30% wider and breaks the v1 type rule (sentence case in MN). Skip this if the client's "Classical" system insists on caps. |
| Photo note: natural, **no grade** | The owner removed the sepia grade. The v1 wireframe still said "graded". Never re-add a filter. |

## Purpose
In one screen, say who White Group is and that it wants partners and investors, then offer the two main CTAs. Give retail buyers a single quiet path to the seasonal order.

## Content fields (`data.ts`)
| Key | Type | Notes |
|---|---|---|
| `nav[]` | `{href, label}` | reordered, see Copy |
| `cta` | string | header + hero primary (existing) |
| `menu`, `langLabel` | string | existing |
| `hero.kicker`, `hero.l1`, `hero.l2`, `hero.sub` | string | existing, keep |
| `hero.ctaDeck` | string | **new (restored)** |
| `order.strip` | string | **new**. `""` hides the strip. Defined in 03b |
| `CERTS` | const | existing, shown as tags |
| Photo | `/photos/cold-room.jpg` (or `VIDEOS.hero`) | existing, natural, no filter |

## Copy
| Key | mn | en |
|---|---|---|
| nav[0] `#model` | Бизнес загвар | Business model |
| nav[1] `#order` | Захиалга | Order |
| nav[2] `#market` | Зах зээл | Market |
| nav[3] `#roadmap` | Замнал | Roadmap |
| nav[4] `#partner` | Хамтын ажиллагаа | Partnership |
| nav[5] `#team` | Баг | Team |
| nav[6] `#faq` | Асуулт | FAQ |
| cta | Хамтарч ажиллах (existing) | Become a partner (existing) |
| hero.kicker / l1 / l2 / sub | existing | existing |
| hero.ctaDeck | Хөрөнгө оруулагчийн танилцуулга хүсэх | Request the investor deck |
| order.strip | Өвлийн идэшний захиалга нээлттэй — багц, үнийг үзэх | Winter meat orders are open — see packages and prices |

## Interaction
| Element | States |
|---|---|
| `[Хамтарч ажиллах]` | Existing: gold-300 outline on dark. Hover gold/12 fill, active gold/22, focus outline. Click goes to `#contact` and **clears** the partner type (`onPick(null)`). |
| `[Хөрөнгө оруулагчийн танилцуулга хүсэх]` | Secondary on dark: `.btn min-h-12 border-paper/40 text-paper hover:bg-paper/10 active:bg-paper/16`. Click calls `onPick(0)` (Investor), goes to `#contact`, then focuses Name after the scroll, the same as the 06 CTAs. Full width on mobile, allowed to wrap. |
| Seasonal strip | One `<a href="#order">`, full width, `bg-surface`, `border-b border-line`, min-h 44px, 15px ink. The words after the dash are gold-700 and underlined, followed by `→`. Hover: underline thickens. Focus: global outline (inset, `-outline-offset-2`). **Not sticky**: it scrolls away with the page, so it never eats viewport height on a phone. Not rendered when `order.strip` is `""`. |
| Header CTA, language toggle, Sheet | unchanged |
| Cert tags | static |

Empty, error and loading states do not apply. If a video is set, it falls back to the photo poster.

## Data source
Static, from `data.ts` (`COPY[lang]`, `CERTS`, `VIDEOS`). The strip lives in `page.tsx`, inside `<main>` before `<LandingHero>`. No new component.

## Motion notes
- Unchanged: the photo settles and the hero sequence plays (kicker → headline → sub → CTAs → certs), ≤1.2s. Both CTAs share the `ctas` step.
- The strip is static. No slide-in, no ticker, no pulse.
- Reduced motion: everything is shown at once.

## Acceptance
- [ ] The hero has two buttons. The investor one preselects "Хөрөнгө оруулагч" in the form (09) and focuses Name. The primary preselects nothing.
- [ ] At 390px MN, both buttons are full width and ≥48px tall, and the investor label wraps without clipping.
- [ ] The strip shows only when `order.strip` is non-empty, is ≥44px tall, is not sticky, and lands on `#order` below the sticky header (`scroll-mt-20` on the section).
- [ ] Nav order equals page order in the header, the Sheet and the footer (all read `t.nav`).
- [ ] At 1280px MN the inline nav (7 links), toggle and CTA fit on one row. If they don't, raise the inline-nav breakpoint rather than shrinking the type.
- [ ] Hero photo has no CSS filter. The overlay keeps hero text ≥4.5:1.
