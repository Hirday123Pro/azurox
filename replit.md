# Azurox Asset Marketplace

Azurox is a premium Roblox asset discovery marketplace with Discord-only manual fulfillment and a protected studio dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/azurox/src/pages/marketplace.tsx` — public archive browse, search, filtering, sorting, and summary
- `artifacts/azurox/src/pages/asset-detail.tsx` — asset gallery, metadata, related drops, and Discord handoff
- `artifacts/azurox/src/pages/admin.tsx` — first-run setup/login and protected asset CRUD/password management
- `artifacts/azurox/src/components/SiteChrome.tsx` — header theme toggle and pencil-only admin unlock dialog
- `artifacts/azurox/src/lib/pricing.ts` — backward-compatible Robux/USD/Both price formatting
- `artifacts/azurox/src/index.css` — Azurox theme, typography, texture, and motion tokens
- `lib/api-spec/openapi.yaml` — source of truth for the asset/admin API
- `artifacts/api-server/src/routes/` — Express handlers for assets and admin sessions
- `lib/db/src/schema/assets.ts` — PostgreSQL/Drizzle schema for `assets` and `admin`

## Architecture decisions

- Public browsing remains available without authentication; only asset mutations require the admin session.
- Orders intentionally redirect to each asset's `discord_link`; there is no checkout or payment gateway.
- The initial admin password is created from the `/admin` first-run screen and stored as a scrypt hash with a unique salt.
- The public admin entry point is intentionally a small pencil action; the quick unlock creates the first password on an unconfigured database.
- Asset pricing keeps the legacy `price`/`currency` pair while also storing optional Robux and dollar values plus a display mode.
- The frontend keeps a meaningful local preview library as a graceful fallback when the API is unavailable.

## Product

- Browse curated UI, Scripts, 3D Models, and Maps drops.
- Search by title/description, filter by collection, and sort by newest/oldest/price.
- Open detail pages with preview artwork, pricing, related drops, and a Discord order CTA.
- Manage the archive from `/admin` with setup/login, create/edit/delete, and password change.
- Add multiple preview image URLs per drop, choose Robux-only/USD-only/both pricing, and show claim instructions before Discord handoff.

## User preferences

No additional preferences recorded.

## Gotchas

- The web artifact build expects `PORT` and `BASE_PATH` from its managed workflow; use the workflow for preview runs.
- The API contract is OpenAPI-first; rerun codegen after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
