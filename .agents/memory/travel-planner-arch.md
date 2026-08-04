---
name: Travel Planner Architecture
description: フルスタック旅行計画アプリの構成・スタック・主要決定事項
---

# Travel Planner — Architecture Notes

## Stack
- **Frontend**: React + Vite (`artifacts/travel-planner`), Clerk auth, Wouter routing, TanStack Query, shadcn/ui, Recharts
- **Backend**: Express API server (`artifacts/api-server`), Drizzle ORM + Replit PostgreSQL
- **Auth**: Replit-managed Clerk (keys: CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, VITE_CLERK_PUBLISHABLE_KEY)
- **API spec**: OpenAPI → Orval codegen → `lib/api-client-react` hooks + `lib/api-zod` schemas

## Routing
- Path-based routing via Replit proxy: `/` → travel-planner (port 24289), `/api` → api-server (port 8080)
- No Vite proxy needed — Replit handles `/api/*` → api-server automatically

## Key Decisions
- Drizzle ORM with `numeric` type returns strings — always `parseFloat()` before returning JSON
- Orval v8.23 generates Zod v4 syntax (`zod.int()`); patched with sed in `lib/api-spec/package.json` to `zod.number().int()`
- User JIT provisioning: `ensureUser()` called at start of each trip route handler
- Soft delete on trips via `deletedAt` column; related records (transportation etc.) NOT cascaded

## DB Tables
users, categories, trips, transportation, accommodation, budget, expense, notification

## Seeded Categories
交通費, 宿泊費, 食費, 観光・体験, お土産, その他

## Design Palette
Sunset Orange (#primary: hsl(16,93%,56%)) + Ocean Teal (#secondary: hsl(181,65%,35%))
Fonts: Outfit (sans) + Playfair Display (serif)
