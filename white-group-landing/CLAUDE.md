# white-group-landing — CLAUDE.md

Public **marketing site** for "Вайт групп" ХХК (White Group LLC). Completely
separate from the ERP (`../meat-factory-front-end`) and the API
(`../meat-factory-back-end`) — **no backend, no auth, no GraphQL**. Just a static,
prerendered page. Copy is in Mongolian.

## Stack
Next.js 16 (App Router) · Tailwind v4 · **Base UI (`@base-ui/react`) — NOT Radix**
· shadcn-style `ui/` · lucide · sonner.

## Run
- `pnpm install` then `pnpm dev` → `http://localhost:3001`.
- `pnpm build` (prerenders `/`) · `pnpm start` · `pnpm lint`.
- Note: uses **pnpm**; runs on **:3001** (the ERP front-end is :3000).

## Layout
- `src/app/page.tsx` — composes the landing sections; `layout.tsx` + `globals.css`.
- `src/components/landing/` — section components **+ `data.ts` (all copy/content
  lives here — edit copy there, not in JSX)**.
- `src/components/ui/` — shadcn/base-ui primitives used by the page.
- `public/brand/` — logo/brand assets.

## Conventions
- Single static route `/` — keep it prerenderable (no server data fetching, no
  client-only-at-top-level patterns that break static export).
- Content edits go in `landing/data.ts`; visual/section structure in the section
  components. Match the existing Tailwind v4 + base-ui usage.
- **Base UI ≠ Radix**: no `asChild`; style triggers via `className`/`render`.

## Contract
None — this app is self-contained. It does NOT talk to the backend or share code
with the other two apps. No cross-session coordination needed.
