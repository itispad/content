# Next.js + Vercel + Tailwind + shadcn: Dashboard-Style App Best Practices

**Project:** Content Management Tool (Metricool-style)  
**Researched:** March 2025  
**Focus:** App Router, layouts, shadcn components, Vercel deployment, state/data/auth, loading/error/RSC.

---

## 1. App Router vs Pages Router

**Recommendation: Use the App Router** for this project.

- **App Router** is the current standard for new Next.js apps and aligns with the dashboard + multi-page structure (Dashboard, Content planner, Idea generator).
- **Benefits for this app:**
  - **Layouts:** Shared sidebar/nav and shell persist across Dashboard, Planner, and Idea generator without full re-renders (partial rendering).
  - **Streaming:** `loading.js` + Suspense give instant loading states and better perceived performance when fetching platform stats or scheduled content.
  - **Server Components by default:** Smaller client JS; only interactive pieces (tables, forms, calendar) need `"use client"`.
  - **Route groups:** Clean organization (e.g. `(dashboard)`, `(auth)`) without changing URLs.
- **Pages Router** remains supported and can have higher raw throughput in some benchmarks; for a typical dashboard with moderate concurrency, App Router is the better default and offers better DX and streaming.

**Sources:**  
[Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) · [Creating Layouts and Pages (Learn)](https://nextjs.org/learn/dashboard-app/creating-layouts-and-pages) · Community comparisons (2024–2025).

---

## 2. Recommended Route and Layout Structure

Use **file-system routing** with a **shared app layout** and **segment layouts** for the three main areas.

### Suggested structure

```
app/
├── layout.tsx                 # Root: html, body, fonts, ThemeProvider (dark mode)
├── page.tsx                   # Landing or redirect to /dashboard
├── loading.tsx                # Global loading fallback (optional)
├── error.tsx                  # Global error boundary (optional)
├── (dashboard)/               # Route group: no "(dashboard)" in URL
│   ├── layout.tsx             # Shared shell: sidebar, nav, main content area
│   ├── dashboard/
│   │   ├── page.tsx           # /dashboard — stats, platform toggles
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── planner/
│   │   ├── page.tsx           # /planner — scheduling UI
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── ideas/
│       ├── page.tsx           # /ideas — idea generator + to-do
│       ├── loading.tsx
│       └── error.tsx
├── api/                       # Route Handlers (webhooks, external callbacks, optional public API)
│   └── ...
└── globals.css
```

**Why this structure:**

- **Route group `(dashboard)`:** Keeps URLs as `/dashboard`, `/planner`, `/ideas` while sharing one layout (sidebar + main content). No extra segment in the path.
- **One layout for all three areas:** Single sidebar/nav; only the page content swaps on navigation (partial rendering).
- **Per-segment `loading.tsx` / `error.tsx`:** Granular loading and error UI; e.g. dashboard stats can stream while planner has its own skeleton.

**Caveats (from Next.js docs):**

- If you later add another route group with a *different* root layout (e.g. `(marketing)`), navigation between groups triggers a full page load.
- Avoid two route groups defining the same path (e.g. two `/about` pages in different groups).

**Sources:**  
[Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) · [Pages and Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) · [Learn: Creating Layouts and Pages](https://nextjs.org/learn/dashboard-app/creating-layouts-and-pages).

---

## 3. shadcn Components That Fit

### Data tables (Dashboard stats, content list, idea to-do)

- Use **Table** + **TanStack Table** (e.g. `@tanstack/react-table`) for sortable, filterable, paginated tables.
- shadcn’s [data table](https://ui.shadcn.com/docs/components/data-table) pattern: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` plus DropdownMenu for column visibility, Checkbox for row selection, Input for filtering.
- Good for: platform stats, scheduled posts list, idea to-do list. Keep table components as Client Components (`"use client"`) where interactivity lives; feed data from Server Components or server-side fetch.

### Charts (Dashboard stats)

- shadcn **Charts** (Recharts-based) at [ui.shadcn.com/charts](https://ui.shadcn.com/charts): area, bar, line, pie, radial, etc.
- Support **dark mode** via CSS variables; fit the existing design system.
- Use for: combined totals, per-platform breakdowns, trends over time. Wrap chart components in Suspense with a skeleton fallback when data is loading.

### Forms (Planner, settings, idea inputs)

- **Form** (React Hook Form + Zod) for scheduling, platform overrides, and idea generator inputs.
- **Input**, **Textarea**, **Select**, **Checkbox**, **Switch** for fields; **Button** for submit/cancel.
- **Label** and **FormMessage** for accessibility and validation errors. Use Server Actions for submit where possible (see below).

### Calendar / scheduler (Content planner)

- **Calendar** (React DayPicker) for date selection: [Calendar – shadcn](https://ui.shadcn.com/docs/components/base/calendar).
- For a full “schedule across platforms” view, combine Calendar with a custom grid or list of time slots; shadcn doesn’t ship a full scheduler, so the calendar is the building block (single/range selection, Tailwind styling).
- **Popover** + **Calendar** is the typical date-picker pattern in the docs.

### Dark theme

- **next-themes** with shadcn: theme is driven by CSS variables; components use semantic tokens (e.g. `background`, `foreground`) and automatically support dark mode.
- Set `defaultTheme="dark"` (or system) in root layout and wrap the app with `ThemeProvider` so Dashboard, Planner, and Ideas all respect dark mode.

### Other useful components

- **Card** for stat blocks and idea cards.
- **Tabs** for switching between platforms or views (e.g. list vs calendar).
- **Skeleton** for loading states (see below).
- **DropdownMenu**, **Select** for platform toggles and filters.

**Sources:**  
[shadcn Data Table](https://ui.shadcn.com/docs/components/data-table) · [shadcn Charts](https://ui.shadcn.com/charts) · [Calendar](https://ui.shadcn.com/docs/components/base/calendar) · [Themes](https://ui.shadcn.com/docs/themes).

---

## 4. Vercel Deployment

### Serverless and Edge

- **Default:** Next.js on Vercel runs as **serverless functions** per route (App Router: Server Components and Route Handlers). No extra config needed for Dashboard/Planner/Ideas.
- **Edge:** Use **Edge Runtime** only where you need very low latency (e.g. middleware, simple auth checks, redirects). Don’t force the whole app to Edge; keep data fetching and DB access in Node serverless unless you have a specific Edge-compatible stack.

### Environment variables and API keys

- **Never** put secrets in `NEXT_PUBLIC_*` — those are bundled into the client.
- **Server-only:** Store platform API keys, DB URLs, and auth secrets in env vars **without** `NEXT_PUBLIC_`. Use them only in Server Components, Route Handlers, Server Actions, and `getServerSession`/equivalent.
- **Vercel dashboard:** Set env vars per environment (Production, Preview, Development). Prefer **Sensitive** for API keys so values aren’t readable after save.
- **Rotation:** Change secrets in Vercel first, then rotate the actual keys, to avoid downtime.
- **Preview deployments:** By default they can inherit production env; configure carefully so preview doesn’t hit production APIs or DBs unless intended.

**Sources:**  
[Vercel Environment Variables](https://vercel.com/docs/environment-variables) · [Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) · [Rotating secrets](https://vercel.com/docs/environment-variables/rotating-secrets).

---

## 5. State and Data: Where to Keep What

### Platform connections and stats

- **Server-first:** Treat “connected platforms” and “stats” as server data. Fetch in **Server Components** (async `page.tsx` or dedicated components) or in **Route Handlers** if the client needs to call an API (e.g. refresh button).
- **Caching:** Use Next.js **fetch cache** or **React `cache()`** for request deduplication; use **unstable_cache** or a data layer (e.g. Redis/DB) for cross-request caching if you have high traffic or rate limits from platform APIs.
- **DB/cache:** Store connection metadata (tokens, platform IDs) and aggregated stats in a DB or cache; keep API keys and tokens only on the server (env or secure storage). Don’t store secrets in client state.

### Server Components vs API routes vs Server Actions

- **Server Components:** Default for reading. Fetch platform stats, scheduled posts, and idea lists in Server Components; pass data as props to Client Components (tables, charts, forms).
- **Route Handlers (`app/api/...`):** Use for (1) webhooks from third parties, (2) public or external API endpoints, (3) client-side fetch (e.g. `fetch('/api/...')`). Protect with auth (see below).
- **Server Actions:** Use for mutations from the UI: “save schedule”, “toggle platform”, “add idea to to-do”. They get CSRF protection and type-safe arguments; no need to expose a REST endpoint. Prefer Server Actions over Route Handlers for form submissions and button-driven updates.

### Auth (“my accounts”)

- **NextAuth.js** or **Clerk** both work with App Router. Clerk has a [quickstart](https://clerk.com/docs/quickstarts/nextjs) and [auth() in Server Components](https://clerk.com/docs/references/nextjs/auth); NextAuth has App Router support with `getServerSession`.
- **Pattern:** Protect layout or page by checking session in the server layout/page (or middleware). Use `auth()` / `getServerSession()` in Server Components and Route Handlers; never rely only on middleware for security (defense in depth).
- **Data access:** Validate the session (e.g. `userId`) at every data access (Server Component, Server Action, Route Handler) so “my accounts” and “my stats” are scoped to the signed-in user.

**Sources:**  
[Clerk Next.js App Router](https://clerk.com/docs/quickstarts/nextjs) · [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns) · Community articles on Server Actions vs Route Handlers (e.g. Coding in Flow, Makerkit).

---

## 6. Performance and DX: Loading, Errors, RSC

### Loading states

- **`loading.tsx` per segment:** Add `loading.tsx` next to `page.tsx` (e.g. under `dashboard/`, `planner/`, `ideas/`). Next.js wraps the page in Suspense and shows this UI while the segment loads. Use shadcn **Skeleton** for a consistent look.
- **Nested Suspense:** For pages that have multiple data sources (e.g. stats + recent posts), wrap each async block in `<Suspense fallback={...}>` so the rest of the page can stream in; avoid one big loading state for the whole page.
- **Reference:** [loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading).

### Error boundaries

- **`error.tsx`:** Must be a Client Component (`'use client'`). Receives `error` and `reset`; use `reset()` to retry. Place at segment level (e.g. `dashboard/error.tsx`) so a failure in Dashboard doesn’t take down the whole app.
- **`global-error.jsx`:** Only for root-level failures; must define its own `<html>` and `<body>`.
- **Reference:** [error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error).

### Incremental adoption of React Server Components

- **Default:** All components in the App Router are Server Components unless marked `"use client"`.
- **Use Client Components only where needed:** interactivity (tables, charts, forms, calendar), browser APIs, or hooks (useState, useEffect). Keep data loading and layout in Server Components.
- **Adopt incrementally:** Add `loading.tsx` and `error.tsx` per route as you build; introduce Suspense boundaries where you have multiple async sections. No need to refactor everything at once.

**Sources:**  
[Next.js loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading) · [Next.js error](https://nextjs.org/docs/app/api-reference/file-conventions/error) · [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns).

---

## 7. Summary Table

| Area | Recommendation |
|------|----------------|
| **Router** | App Router |
| **Structure** | Route group `(dashboard)` with shared layout; `/dashboard`, `/planner`, `/ideas` |
| **Tables** | shadcn Table + TanStack Table |
| **Charts** | shadcn Charts (Recharts), dark via CSS variables |
| **Forms** | shadcn Form (RHF + Zod) + Server Actions |
| **Calendar** | shadcn Calendar + Popover; custom grid for scheduler |
| **Theme** | next-themes + shadcn, default dark |
| **Secrets** | Server-only env vars; never `NEXT_PUBLIC_` for keys |
| **Data** | Server Components for read; Server Actions for mutations; Route Handlers for webhooks/public API |
| **Auth** | Clerk or NextAuth; check session server-side at every data access |
| **Loading** | `loading.tsx` + Skeleton per segment; Suspense for nested async |
| **Errors** | `error.tsx` per segment; `global-error.jsx` only at root |

---

## 8. Links Quick Reference

- [Next.js App Router – Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js – Creating Layouts and Pages (Learn)](https://nextjs.org/learn/dashboard-app/creating-layouts-and-pages)
- [Next.js – loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Next.js – error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [shadcn Data Table](https://ui.shadcn.com/docs/components/data-table)
- [shadcn Charts](https://ui.shadcn.com/charts)
- [shadcn Calendar](https://ui.shadcn.com/docs/components/base/calendar)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
