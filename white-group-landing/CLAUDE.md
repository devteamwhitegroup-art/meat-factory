# white-group-landing — CLAUDE.md

Public **marketing site** for "Вайт грүпп" ХХК (White Group LLC). Completely
separate from the ERP (`../meat-factory-front-end`) and the API
(`../meat-factory-back-end`) — **no backend, no auth, no GraphQL**. Just a static,
prerendered page. Copy is in Mongolian.

## Stack
Next.js 16 (App Router) · Tailwind v4 · **Base UI (`@base-ui/react`) — NOT Radix**
· shadcn-style `ui/` (only `sheet` + `button` left) · lucide.
Design = client's "Classical" system: Cormorant Garamond / Lora, tokens +
`.btn/.card/.tag/.input/.plate` classes in `globals.css` (`text-ink`, `bg-paper`,
`text-gold-700`, `border-line`, `bg-night-deep`…).

## Run
- `pnpm install` then `pnpm dev` → `http://localhost:3001`.
- `pnpm build` (prerenders `/`) · `pnpm start` · `pnpm lint`.
- Note: uses **pnpm**; runs on **:3001** (the ERP front-end is :3000).

## Layout
- `src/app/page.tsx` — `"use client"`: holds the МН/EN toggle, passes `t` (copy for
  the active lang) to every section; still prerendered in Mongolian. `layout.tsx` + `globals.css`.
- `src/components/landing/` — section components **+ `data.ts` (all copy/content
  lives here — edit copy there, not in JSX)**.
- `src/components/ui/` — shadcn/base-ui primitives used by the page.
- `public/brand/` — logo/brand assets. `public/photos/` — factory photos (resized to
  2400px; originals are 6000px/12 MB — resize before adding new ones).

## Conventions
- Single static route `/` — keep it prerenderable (no server data fetching, no
  client-only-at-top-level patterns that break static export).
- Content edits go in `landing/data.ts` — **both `mn` and `en`** (typed: `en` must
  match `mn`'s shape). Optional videos: `VIDEOS` in `data.ts`; visual/section structure in the section
  components. Match the existing Tailwind v4 + base-ui usage.
- **Base UI ≠ Radix**: no `asChild`; style triggers via `className`/`render`.

## Contract
None — this app is self-contained. It does NOT talk to the backend or share code
with the other two apps. No cross-session coordination needed.
