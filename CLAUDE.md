# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager:** npm (not yarn/pnpm/bun)

```bash
# Run all apps in dev mode
npm run dev

# Run a specific app
npx turbo run dev --filter=@repo/core      # Admin portal (port 5173)
npx turbo run dev --filter=@repo/depot     # Depot portal
npx turbo run dev --filter=@repo/member    # Member portal

# Build
npm run build
npx turbo run build --filter=@repo/core

# Lint & type check
npm run lint
npm run check-types

# Format
npm run format

# Server (NestJS) - run from apps/server/
npm run test              # unit tests
npm run test:watch        # watch mode
npm run test:e2e          # e2e tests
npm start                 # start server
```

## Architecture

This is a **Turborepo monorepo** with npm workspaces.

### Apps

- `apps/core` — **Admin Portal** (React 19 + Vite + TailwindCSS v4). Modules: Dashboard, Inventory Management, Dealers, Wallet Management, Order Management, Product Management, Payout, Reports, Audit Trails, Bonuses, Settings.
- `apps/depot` — **Depot Portal** (React 19 + Vite). Modules: Dashboard, Inventory, Order Management, Purchase Management, Wallet, Organization.
- `apps/member` — **Member Portal** (React 19 + Vite). Similar structure to depot.
- `apps/server` — **NestJS API** backend with Prisma ORM and JWT auth.

### Shared Packages

- `@repo/multiverse-ui` — Internal component library. Exports components in four categories: `input_controls` (TextInput, SelectInput, NumberInput, DatePicker, etc.), `containers` (Card, Modal, Dialog, Drawer, PageWrapper, etc.), `informationals` (Table, Badge, StatCard, ModuleHeader, etc.), `navigationals` (Sidebar, Breadcrumb, Pagination, TabGroup, etc.).
- `@repo/app-providers` — Shared React providers: `AuthProvider` (JWT token in localStorage), `QueryProvider` (TanStack Query + axios interceptors for auth/errors), `BrowserRouterProvider`.
- `@repo/utilities` — Utility functions: `createForm` (form factory), `formatCurrency`, `formatDate`, `validationSchema`, `mockApi`, `generateMockDataFromZodSchema`, etc.
- `@repo/hooks` — Shared hooks: `useFileUpload`, `useCountdown`, `use422FormErrorSetter`, `useNormalizedSearchParams`, Philippine address queries (`useProvinceListQuery`, etc.).

### Key Patterns

**Auth flow:** `App.tsx` checks `authData.token` from `AuthProvider` (persisted in `localStorage`). Authenticated users see `<Private />`, unauthenticated see `<Public />`. Token is attached to all API requests via an axios interceptor in `QueryProvider`. 401/403 responses redirect to `/logout`.

**Form pattern:** All forms use `createForm` from `@repo/utilities` (backed by `react-geek-form`) with a Zod schema. Call `createForm({ zodSchema })` to get typed `forwardFormContext`, field components, and hooks (`useFieldArray`, `useWatch`, etc.).

```ts
const { forwardFormContext, TextInput, SelectInput } = createForm({ zodSchema: mySchema });
const MyPage = forwardFormContext((_, ctx) => {
  return <form onSubmit={ctx.handleSubmit(handler)}>...</form>;
});
```

**Module file structure:** Each feature module within an app follows this pattern:
```
app/feature-name/
  page.tsx          # Main routed component
  schemas.ts        # Zod type schemas
  _hooks/           # TanStack Query hooks (useXxxQuery, useXxxMutation)
    index.ts        # Re-exports
  [id]/page.tsx     # Detail pages (dynamic routes)
  add/page.tsx      # Create pages
```

**Data fetching:** TanStack Query v5 hooks in `_hooks/`. Query keys are defined as arrays (e.g., `["PRODUCTS"]`). Invalidation helpers are co-located and exported (e.g., `invalidateProductListDataQuery()`). `queryClient` is exported from `@repo/app-providers`.

**API client:** Each frontend app has `src/utilities/api.ts` — an axios instance using `import.meta.env.VITE_API_BASE_URL`. Import as `import { api } from 'utilities'` (path alias).

**Path aliases** (all apps): `app` → `src/app`, `hooks` → `src/hooks`, `assets` → `src/assets`, `utilities` → `src/utilities`, `src` → `src/`.

**Server-side 422 errors:** Use `use422FormErrorSetter` from `@repo/hooks` to map server field validation errors into `createForm` field errors.
