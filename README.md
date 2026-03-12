# Content Management Tool

Metricool-style app: **Dashboard** (stats + platform toggles), **Content planner** (schedule & publish), **Idea generator** (niche analysis + bounce ideas).

## Stack

- **Next.js** (App Router), **Vercel**, **Tailwind**, **shadcn UI**, dark mode
- **Auth:** Clerk
- **DB:** Supabase

The app lives at the repo root. Deploy to Vercel from this directory.

## Getting started

1. **Copy env and fill in secrets**

   ```bash
   cp .env.example .env.local
   ```

   Set:

   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from [Clerk](https://dashboard.clerk.com)
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from [Supabase](https://supabase.com/dashboard) (Project Settings → API)

2. **Supabase schema**

   Run the migration in `supabase/migrations/` against your Supabase project (e.g. via Supabase CLI or Dashboard SQL editor).

3. **Install and run**

   ```bash
   npm install --ignore-engines
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to sign-in, then to `/dashboard`.

## Routes

- `/` → redirects to `/dashboard`
- `/dashboard` — stats (placeholder in Phase 1)
- `/planner` — content scheduling (placeholder in Phase 1)
- `/ideas` — idea generator (placeholder in Phase 1)
- `/sign-in`, `/sign-up` — Clerk auth

All of `/dashboard`, `/planner`, and `/ideas` require sign-in.

## Env and secrets

- **Public (client):** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase anon key is safe to expose; use RLS).
- **Server-only:** `CLERK_SECRET_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY`. Never use `NEXT_PUBLIC_` for these.

## Roadmap

See `.planning/ROADMAP.md` for phases. Phase 1 (Foundation) is implemented.
