
## Implementer notes (step 2)
- Stop 1 body: spec copy was only the first sentence of `about.p2`. I kept the second sentence ("Махны амт, чанар нь судлаачид, хэрэглэгчдийн үнэлгээг хүртсэн.") so no real fact is dropped. Remove it if the owner dislikes the claim.
- `prod.items[].kicker` replaced by `stock: "small" | "large"`; the Бог/Бод label now comes from the stock toggle.
- `std.title` ("Олон улсын стандартаар баталгаажсан") and `cap.big/sub` are retired in favour of `team.certsTitle` and `numbers`/`model.sub`, per handoff §4.
- Roadmap planned tabs show the literal year `[PLACEHOLDER]`; the active panel shrinks the numeral for long years so it does not overflow at 390px.
- Model rail on mobile hides inactive labels with `sr-only` below `md`, as specced; the rail is `min-w-[672px]` (96px per stop).
- Language choice is not persisted in localStorage (optional in §0).

## Motion (step 3)
- Roadmap rule draw (05): the "solid gold rule" is per-tab `border-b`, with no single rule element to animate with transform/opacity. Drawing it left to right needs a dedicated rule element in `landing-roadmap.tsx` (structural). Skipped; the rule is simply visible.
