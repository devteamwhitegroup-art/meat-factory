@AGENTS.md

# meat-factory-front-end — CLAUDE.md

Next.js ERP UI for the meat-factory operation. Talks to the **separate**
`../meat-factory-back-end` GraphQL API (`:8086`). All user-facing copy is in
**Mongolian**. (Read `AGENTS.md` above first — this is a non-standard Next.js 16.)

## Stack
- Next.js 16 (App Router; `searchParams`/`params` are **async** — `await` them).
- Apollo Client v4 · GraphQL Codegen (**client-preset**).
- Tailwind v4 · **Base UI (`@base-ui/react`) — NOT Radix** · shadcn-style `ui/`
  components · lucide · sonner.

## Run
- `npm run dev` (`:3000`) · `npx tsc --noEmit` (typecheck) · `npx eslint` (lint).
- `npm run gen` — regenerate GraphQL types (see below).

## ⚠️ Codegen workflow — THE most common footgun
Queries/mutations live in `src/lib/queries/*.ts` as `graphql(\`…\`)` tagged
strings. `npm run gen` introspects the **running backend** (`:8086`, see
`codegen.ts`) and writes `src/lib/gql/*`. `graphql()` resolves a document by
**exact string match** against that generated map.
- **If you edit/add a query and don't re-run `npm run gen`**, `graphql()` returns
  the raw string → Apollo throws *"You must wrap the query string in a gql tag"*.
- So after ANY query edit: ensure the BE is running with the matching schema →
  `npm run gen` → `npx tsc --noEmit`. `src/lib/gql/**` is eslint-ignored.
- Need a new BE field? The BE schema must expose it BEFORE `gen` (codegen
  validates documents against the live schema). Coordinate via the contract below.

## Conventions (reuse these — don't re-inline)
- **Mutations** route through `runMutation(action, {success, onSuccess})`
  (`src/lib/runMutation.ts`). `success` may be a string OR `(data)=>string`.
  Unwrap envelopes with `unwrap` / `unwrapList` (`src/lib/unwrap.ts`). Pre-submit
  validation toasts stay inline.
- **Data fetching**: server pages use `getClient().query(...)` (`src/lib/apollo/
  server.ts`) + `unwrapList`; client components use `useQuery`/`useMutation`.
  Most list pages are **server components driven by `searchParams`** (e.g.
  `?status=`, `?from=&to=`).
- **Base UI ≠ Radix**: no `asChild`. Style a `PopoverTrigger`/etc. via
  `buttonVariants({...}) + className` (or Base UI's `render` prop). Calendar is
  react-day-picker v10 (`mode="range"` works).
- **Large route-client files** split inline sub-components into a sibling
  `_components/` folder (Next private folder), each `'use client'` + named export
  + explicit prop types. For deep codegen prop types derive from the doc:
  `ResultOf<typeof SomeDoc>` (`@graphql-typed-document-node/core`).
- Other shared helpers: `useFileUpload(type)`, `compact`, `navIsActive`,
  `proxyUpstream`/`getSessionToken` (`src/lib/api/proxy.ts`), format helpers in
  `src/lib/format/`.
- **Auth**: httpOnly cookie `mf_session`; client-readable `mf_role` cookie for
  role-gated UI; `requireCap(...)` guards server pages. Browser GraphQL traffic
  is proxied through Next route handlers (`src/app/api/*`).

## 🔗 Contract with the back-end
You **consume** the BE GraphQL schema; you don't need to know its internals. To
build a feature that needs new data, you need: the operation name, its args, and
its return shape — i.e. the SDL snippet. Get that from the BE session (or a
committed `schema.graphql`), make sure the BE is running with it, then write the
`graphql()` query and run `npm run gen`.
