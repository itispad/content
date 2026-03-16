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
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from [Supabase](https://supabase.com/dashboard) (Project Settings → API)
   - **Phase 2 (Dashboard):** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com/) (OAuth 2.0 Client ID for YouTube), and `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` or your production URL)

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
- `/dashboard` — stats from connected platforms (Phase 2: YouTube); connect via “Connect YouTube,” toggle platforms for combined totals
- `/planner` — content scheduling (placeholder in Phase 1)
- `/ideas` — idea generator (placeholder in Phase 1)
- `/sign-in`, `/sign-up` — Clerk auth

All of `/dashboard`, `/planner`, and `/ideas` require sign-in.

## Env and secrets

- **Public (client):** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase anon key is safe to expose; use RLS).
- **Server-only:** `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (required for Phase 2), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Never use `NEXT_PUBLIC_` for these.

## Roadmap

See `.planning/ROADMAP.md` for phases. Phase 1 (Foundation) and Phase 2 (Dashboard, YouTube) are implemented.
