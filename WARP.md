# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick commands

- Install deps: `npm install`
- Start dev server: `npm start`
- Build production: `npm run build`
- Run tests (watch): `npm test`
- Run a single test:
  - By file: `npm test -- src/App.test.tsx`
  - By name pattern: `npm test -- -t "renders learn react link"`
- Eject (irreversible): `npm run eject`

Notes
- No explicit lint script. CRA runs ESLint during `start`/`build` based on `eslintConfig` in `package.json`.
- TypeScript is configured with `tsconfig.json` and enforced by the CRA toolchain.

## Project architecture (big picture)

- App type: React + TypeScript single-page application (Create React App)
- Styling: TailwindCSS (configured via `tailwind.config.js` and `postcss.config.js`)
- Routing: React Router with lazy-loaded pages and guarded routes
- Backend: Supabase (Auth + Postgres + RLS)
- Offline: In-memory + localStorage cache layer for key datasets

### Routing and guards
- Entry: `src/App.tsx`
  - Declares routes using `react-router-dom` and lazy loads pages for code-splitting.
  - Uses two key guards:
    - `src/components/ProtectedLayout.tsx` wraps authenticated areas (adds nav/drawer + `AuthGuard`).
    - `src/components/RoleGuard.tsx` enforces role-based access per route using `localStorage` keys `is_logged_in` and `user_role`.
- Centralized paths: `src/components/routes.tsx` exports `ROUTES` constants used across the app.

### RBAC model
- Source: `src/rbac/rbac.ts`
  - Roles: `admin`, `blood_bank_admin`, `blood_bank_staff`, `hospital_staff`, `donor`.
  - Permissions: `<resource>:<action>:<scope>` strings and helpers `can`, `canAny`.
  - Menus per role and `routePermissions` map are defined here for consistent UI gating.

### Supabase integration
- Client: `src/utils/supabaseClient.ts`
  - Provides a configured Supabase client consumed across pages/services.
  - If you rotate credentials, update this file or refactor to read from environment variables.
- Database schema/docs:
  - `database-schema-reference.md` contains current tables, indices, and idempotent migration SQL (notably for `blood_transfers` and an audit trail on `blood_inventory`).
  - Additional SQL files at repo root (e.g., `admin_roles_migration.sql`, `rbac_safe_migration.sql`, `database_role_migration.sql`, `fix-orders-rls.sql`) apply specific policy and role changes.

### Offline caching
- Module: `src/utils/offlineCache.ts`
  - Provides a singleton cache with max-age semantics and localStorage backing.
  - Exposes typed helpers and keys for INVENTORY, DONORS, TRANSFERS, FACILITIES, REQUESTS.
  - `getWithFallback` pattern: return cache if valid; otherwise fetch, cache, and return; if offline, falls back where possible.

### Pages and layout
- Pages live in `src/pages/*` and are lazy-loaded in `App.tsx`.
- `ProtectedLayout` composes the top nav and `AppDrawer` and wraps protected content.
- Route groups (examples):
  - Dashboards: Admin, Blood Bank, Hospital
  - Authenticated shared pages: Notifications, Settings, Profile, Account Settings
  - Inventory, Donor management, Requests/Transfers (including Approvals and Order Tracking)
  - Admin-only: User management, facility/blood-type management, analytics, system health

### Utilities and services
- `src/utils/*` includes:
  - `supabaseClient.ts` for backend access
  - `inventoryService.ts`, `authUtils.ts`, etc. for domain utilities
  - `offlineCache.ts` for caching described above

## Database and environment setup

- Supabase
  - Create a project and ensure the tables in `database-schema-reference.md` exist with the provided constraints, indexes, triggers, and RLS.
  - Apply additional SQL in root `*.sql` files as needed (review each file’s intent before running).
- App configuration
  - The Supabase URL and anon key are currently set in `src/utils/supabaseClient.ts`. Update as required for your environment.

## Important references from README

- Tech stack: React + TypeScript, React Router, Supabase (Auth/DB/Realtime), TailwindCSS.
- Implemented features cover authentication, role-based dashboards, donor/inventory/request/transfer flows, analytics, settings, and offline support.
- Getting started: `npm install` → set Supabase credentials → apply schema SQL → `npm start`.

## Conventions to keep Warp productive

- Use `ROUTES` from `src/components/routes.tsx` when adding new routes.
- Gate new pages with `RoleGuard` and place them under `ProtectedLayout` when authentication is required.
- Extend RBAC in `src/rbac/rbac.ts` for any new resources/actions to keep UI and access checks consistent.
- Prefer the offline cache helpers in `src/utils/offlineCache.ts` for list-style data that benefits from caching.
