# meat-factory-back-end — CLAUDE.md

GraphQL API for the meat-factory ERP (livestock intake → weighing → settlement →
sales → shipment → inventory). The npm package name is legacy (`dropshipping`);
this is the meat-factory backend. The web UI lives in the **separate**
`../meat-factory-front-end` repo and consumes this API.

## Stack

- Node + TypeScript (**strict**: `noImplicitAny`, `useUnknownInCatchVariables`).
- Sequelize 6 (PostgreSQL) · Apollo Server v5 · Express 5.
- **GraphQL is the only API surface.** REST is gone except `/file` and `/seed`.

## Run / build

- Dev: `npm run dev` (Windows: copies `.env.local`→`.env`, runs nodemon).
- Build: `npx tsc -p .` (must be clean) → `node dist/index.js`.
- Server: `http://localhost:8086`, GraphQL at `/graphql`.
- DB: local Postgres `meat_factory` on `:5432` (creds in `.env.local`).
- Seed: `POST /seed/admin` (SUPER_ADMIN), `POST /seed/staff` (one per role).

## Layout (per-domain folders under `src/`)

`models/<d>/` · `controller/<d>/` · `schema/typeDefs/<d>/` · `schema/resolver/<d>/`
· `types/<d>/`. **Register every new module in 3 indexes**: `models/index`,
`schema/typeDefs/index`, `schema/resolver/index`.

## Conventions (follow these — they're load-bearing)

- **Resolvers**: NO try/catch. Use the envelope HOFs from `src/utils`:
  `wrapOne(key, handler, msg?)`, `wrapList(key, handler, msg?)` (handler returns
  `{rows,count}`), `wrapItems(key, handler, msg?)`, `wrapVoid(msg, handler)`.
  Handler is `(args, context) => Promise<data>`. `loginAdmin` (dual payload) and
  plain field resolvers stay hand-written. `export default { Query, Mutation }`.
- **Controllers**: static-only classes; validation via `throw new Error`. Reuse
  `findOrThrow(Model, id, msg, options?)` and `listPaginated(Model, doc, {where,
order, include, distinct})` from `src/utils`. `findIdCheck` is a PUBLIC
  cross-controller FK guard (e.g. ShipmentController calls
  CustomerController.findIdCheck) — keep it, just delegate to `findOrThrow`.
  Wrap pg DECIMAL reads in `Number()`. Every catch → `errorMessage(error)`.
- **Models**: `class XModel extends Model implements TX` + `createXModel(sequelize)`.
  `underscored: true` (snake_case columns; camelCase JS attrs + GraphQL unchanged).
  UUID PK. `index`/raw `col()`/`group` use snake_case; attribute `where`/`order` map
  automatically. In `models/index.ts`: all `createXModel()` first, THEN all
  `.associate()` (circular-import safety).
- **TypeDefs**: backticked `#graphql`, `extend type Query/Mutation`, enums via
  `${Object.values(E).join('\n ')}`, `${PaginationSchema}` from global typedef.
  Declare each enum/scalar/input exactly ONCE (`mergeTypeDefs` throws on dupes).
- **Auth**: `@authLogin` (any staff) / `@auth(permissions:[...])` (role-checked vs
  live DB). Roles on `AdminModel.role`. JWT `{id,role}` as `Bearer` in
  `Authorization`. `TContext = {id, role}` injected by the directive.

## ⚠️ Schema sync gotcha

No migrations — schema via `sequelize.sync({ force:false, alter: DB_SYNC_ALTER })`
at boot. **`DB_SYNC_ALTER` is UNSET in `.env.local` → `alter:false`**, so adding a
column to a model does NOT create it in the DB. For one additive nullable column:
`ALTER TABLE "Registrations" ADD COLUMN IF NOT EXISTS <snake_col> VARCHAR(255)`
(tables PascalCase-plural, columns snake_case). Do NOT flip `DB_SYNC_ALTER=true`
globally — alter regenerates ALL tables and can emit malformed SQL.

## 🔗 Contract with the front-end

**The GraphQL schema IS the contract.** When you add/change a field, query, or
mutation, the FE must regenerate its codegen against this server. After your
change, hand the FE session the relevant SDL: the operation name, its args, and
the return type (e.g. `registrations(dateRange: DateRangeInput): RegistrationsResponse`
plus the changed type). Keep this server running so FE `npm run gen` can introspect.

## Domain model (orientation)

Livestock aggregate: `Registration` (intake) → animal lines → `WeighingEntry`
(per-entry negotiated `pricePerKg`) → `ByproductLog` → single-signer
`Verification` → `Settlement` (meat only). Status: REGISTERED→WEIGHED→VERIFIED→
PAYMENT_PENDING→SETTLED (CANCELLED from REGISTERED). Plus Customer,
SalesTransaction, Shipment (PENDING→LOADED→DELIVERED), Inventory ledger
(Item+Movement), and a single `dashboard(dateRange)` aggregation query.
