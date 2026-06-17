# white-group-landing

Public marketing site for **“Вайт групп” ХХК (White Group LLC)** — separate from
the operational ERP (`../meat-factory-front-end`).

- **Stack:** Next.js 16 (App Router) · Tailwind v4 · shadcn/ui (base-ui) · lucide · sonner
- **Intended domain:** `whitegroup.mn` (the dashboard deploys separately to `dashboard.whitegroup.mn`)
- The landing is a single static page at `/` — fully prerendered, no backend/auth.

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:3001
```

## Build

```bash
pnpm build    # static export-ready; route / is prerendered
pnpm start    # serve the production build on :3001
```

## Structure

- `src/app/page.tsx` — composes the landing sections
- `src/components/landing/` — section components + `data.ts` (all copy/content)
- `src/components/ui/` — shadcn components used by the page
- `public/brand/` — logo assets

## TODO before launch

- Real phone / email (placeholders in `landing-contact.tsx` and `landing-footer.tsx`)
- Wire the contact form to a backend or form service (currently shows a toast only)
