# Content Management Tool — Roadmap

**Project:** Metricool-style content management tool (Dashboard, Content planner, Idea generator)  
**Stack:** Next.js, Vercel, Tailwind, shadcn UI, dark mode · **Auth:** Clerk · **DB:** Supabase · **Repo:** app at repo root  
**Last updated:** March 2025

---

## 1. Project goal

**One goal:** Deliver a single web app where users can view combined and per-platform stats, schedule and publish content to multiple social platforms with one general field plus per-platform overrides, and generate content ideas from niche/competitor inputs and AI-powered bounce ideas with a trackable to-do list.

---

## 2. Phases (summary)

| # | Phase | Objective |
|---|--------|------------|
| 1 | **Foundation** | App shell, auth, DB, routes, and design system so the rest of the product can be built and verified. |
| 2 | **Dashboard** | Connect 1–2 platforms for stats; platform toggles; combined totals so users see performance at a glance. |
| 3 | **Content model & planner UI** | Data model for content (draft/scheduled/published, platform overrides) and planner UI without real publishing. |
| 4 | **Scheduler & first platform** | Job queue (e.g. Inngest) and one platform (Instagram or X) so a post can be scheduled and published at the chosen time. |
| 5 | **Media & calendar** | Vercel Blob for media; calendar UI (month/week, timezone-aware) so users can manage content by date and attach assets. |
| 6 | **Retries & multi-platform** | Retry logic and “retry failed” UX; add a second platform so scheduling is reliable and multi-channel. |
| 7 | **Idea generator** | YouTube-based niche/competitor input, AI bounce ideas, and to-do list with status (optional trend cache). |

---

## 3. Phase details

### Phase 1: Foundation

**Goal:** App shell, auth, database, route structure, and design system are in place so all later work can be implemented and tested.

**Decisions (locked in):** **Auth:** Clerk · **DB:** Supabase · **Repo:** Next.js app lives at repo root (no subfolder).

**Objective:** Next.js app with Tailwind, shadcn, dark mode, Clerk, Supabase, and route group `(dashboard)` with `/dashboard`, `/planner`, `/ideas` and a shared layout (sidebar + main).

**Deliverables:**

- Next.js App Router app at repo root; deploy to Vercel from root. Tailwind and shadcn UI.
- Dark mode via `next-themes` (default dark); design tokens and components aligned with research (see `.planning/research/nextjs-vercel-shadcn-dashboard.md`).
- **Clerk:** sign-in/sign-out; session checked server-side on all data access (`auth()` in Server Components and Server Actions).
- **Supabase:** schema for users and any minimal seed data; migrations or schema source of truth (e.g. Supabase migrations or SQL in repo).
- Route structure:
  - Route group `(dashboard)` with layout (sidebar, nav, main content).
  - Routes: `/dashboard`, `/planner`, `/ideas` (placeholder pages).
  - Root `/` redirects to `/dashboard` (or landing as per product decision).
- Per-segment `loading.tsx` and `error.tsx` for dashboard, planner, ideas.
- Env and secrets: Clerk keys, Supabase URL + anon/service key, and future API keys server-only (no `NEXT_PUBLIC_` for secrets; only Clerk publishable key may be public).

**References:**

- `.planning/research/nextjs-vercel-shadcn-dashboard.md` — App Router, route groups, layouts, auth, loading/error.
- `.planning/SUMMARY.md` §4 — Router, components, data, UX.

**Success criteria:**

- User can sign in and see the app shell with sidebar and nav.
- User can navigate to `/dashboard`, `/planner`, `/ideas` and see placeholder content with correct layout.
- Loading and error states render per segment; dark mode works across the app.

---

### Phase 2: Dashboard

**Goal:** Users see stats from 1–2 connected platforms and can toggle platforms to view combined totals.

**Decisions (locked in):** **First platform:** YouTube · **Token storage:** Supabase (e.g. `connected_accounts` table; tokens keyed by Clerk user id). Second platform TBD (e.g. Instagram or X) after YouTube is working.

**Objective:** Dashboard page with platform toggles and combined stats, backed by YouTube first, then optionally a second platform.

**Deliverables:**

- **Connected accounts:** OAuth for **YouTube first**; store access/refresh tokens in **Supabase** (`connected_accounts` or similar; RLS by user). UI to connect and disconnect; optional second platform later.
- **Stats fetch:** Server-side fetch of common metrics (e.g. subscribers, views, engagement) from YouTube Data + Analytics APIs; normalize to shared metric set; optional cache (e.g. 15–30 min) in Supabase to respect quota.
- **Dashboard page:** Table and/or charts (e.g. shadcn + Recharts) showing per-platform metrics; references: nextjs-vercel-shadcn-dashboard (Tables, Charts).
- **Platform toggles:** UI to enable/disable platforms; combined totals (e.g. total followers, total engagement) computed from enabled platforms only.
- **Empty/error states:** No accounts connected; API errors or token expiry handled with clear messaging.

**References:**

- `.planning/research/social-platform-apis.md` — Tier 1/2 platforms, analytics endpoints, rate limits.
- `.planning/SUMMARY.md` §2 — Dashboard scope; §4 — Server Components, Server Actions.

**Success criteria:**

- User can connect at least one platform account and see its stats on the dashboard.
- User can toggle platforms on/off and see combined totals update.
- Disconnected or failing tokens show clear states (e.g. “Reconnect” or error message).

---

### Phase 3: Content model & planner UI

**Goal:** Content is modeled (draft/scheduled/published, platform overrides) and users can create/edit/schedule posts in the planner without real publishing.

**Objective:** Data model and planner UI for multi-platform content with one shared body and per-platform overrides; no live publish yet.

**Deliverables:**

- **Content model (DB):**
  - One content entity: shared body/media references, `scheduledAt`, list of target platforms, per-platform overrides (e.g. caption, hashtags).
  - States: `draft` → `scheduled` → `published`; store publish result per platform (success/failure, platform post ID) when Phase 4+ is done.
  - Platform caption/hashtag limits in config; validate in planner and before enqueue (e.g. Instagram 2,200/30, X 280).
- **Planner UI:**
  - Form (e.g. RHF + Zod) to create/edit content: general content field, platform selection, per-platform caption/hashtag overrides.
  - List/view of content (draft, scheduled, published) with filters; use shadcn Table + TanStack Table.
  - “Schedule” action that sets `scheduledAt` and state to `scheduled` without triggering real publish (scheduler in Phase 4).
- **Validation:** Client and server validation against platform limits; clear errors when over limit.

**References:**

- `.planning/SUMMARY.md` §3 — Content model, platform limits, states.
- `.planning/research/nextjs-vercel-shadcn-dashboard.md` — Form (RHF + Zod), Server Actions, Tables.

**Success criteria:**

- User can create a draft with general content and per-platform overrides and save it.
- User can set a schedule time and mark content as “scheduled” (no publish yet).
- User can see list of drafts and scheduled items; validation prevents over-length captions/hashtags per platform.

---

### Phase 4: Scheduler & first platform

**Goal:** Scheduled content is published at the chosen time to one platform via a job queue.

**Objective:** A scheduler (e.g. Inngest) runs at `scheduledAt` and publishes to one platform (Instagram or X); idempotency and basic error handling.

**Deliverables:**

- **Job queue:** Inngest (or Vercel Cron + serverless) function that runs at publish time; triggered by `scheduledAt` (e.g. cron or Inngest schedule).
- **Publish flow:** Load content by ID; for each target platform, call the platform’s publish API (e.g. Instagram Media Container + Publish, or X Create Tweet); store result (success/failure, platform post ID) per platform.
- **First platform:** Implement publish for one platform (Instagram or X) end-to-end — auth, media URL or text, rate limits per research.
- **Idempotency:** Idempotency key e.g. `publish-${contentId}-${platformId}` to avoid duplicate posts on retries.
- **Media:** For this phase, support text-only or existing media URLs (e.g. placeholder or single URL from content model); full media upload pipeline in Phase 5.

**References:**

- `.planning/SUMMARY.md` §3 — Execution (Inngest), platform scheduling (app-side for Instagram/X).
- `.planning/research/social-platform-apis.md` — Instagram posting, X posting, rate limits, no native scheduling.

**Success criteria:**

- User can schedule a post to the chosen platform and it publishes at the scheduled time (within tolerance of queue/cron).
- Duplicate triggers do not create duplicate posts (idempotency).
- Failed publishes are recorded per platform (e.g. failure reason stored); retry UX in Phase 6.

---

### Phase 5: Media & calendar

**Goal:** Users can attach media via uploads and view/manage content in a calendar.

**Objective:** Vercel Blob (or equivalent) for media; public URLs passed to platform APIs; calendar UI (month/week, timezone-aware).

**Deliverables:**

- **Media pipeline:** Upload to Vercel Blob (or equivalent); store public URLs in content model; pass URLs to platform APIs (Instagram accepts URL; X may need upload-from-URL in job — see research).
- **Planner media UX:** Upload in planner form; preview; optional per-platform override (e.g. different image per platform if API supports).
- **Calendar UI:** Month/week views (e.g. react-big-calendar or FullCalendar) styled for Tailwind/shadcn/dark; show scheduled and published content; timezone-aware (user or app timezone).
- **Calendar interactions:** View and optionally drag-and-drop to reschedule (update `scheduledAt` and re-enqueue if needed).

**References:**

- `.planning/SUMMARY.md` §3 — Media (Vercel Blob), calendar UI, timezone.
- `.planning/research/social-platform-apis.md` — Instagram/X media requirements.

**Success criteria:**

- User can upload media in the planner and schedule a post with that media; it publishes with the correct asset.
- User can open the calendar and see scheduled and published items in the right timezone.
- User can change schedule from the calendar (e.g. drag) and the post publishes at the new time.

---

### Phase 6: Retries & multi-platform

**Goal:** Reliable publishing with retries and “retry failed” UX; support a second platform so users can schedule to two channels.

**Objective:** Step-based retries for publish jobs; in-app “retry failed” for failed platform posts; add second platform (e.g. X if first was Instagram, or vice versa).

**Deliverables:**

- **Retries:** Configure Inngest (or queue) step retries with backoff; idempotency kept so retries do not double-publish.
- **Retry UX:** In planner or dashboard, show per-platform status (success/failure); “Retry” for failed platforms only; optional “Retry all” for a piece of content.
- **Second platform:** Implement publish for a second platform (Instagram or X); same content entity, multiple targets; platform-specific validation and error handling.
- **Rate limits:** Respect per-platform rate limits (e.g. Instagram 200 calls/hour, X 200/15 min); queue or throttle if needed.

**References:**

- `.planning/SUMMARY.md` §3 — Retries, retry UX; §2 — Tier 1 platforms.
- `.planning/research/social-platform-apis.md` — Rate limits, posting endpoints for Instagram and X.

**Success criteria:**

- User can schedule a post to Instagram and X (or two chosen platforms) and both publish at the chosen time.
- Transient failures are retried automatically; user can trigger “retry” for failed platforms and see updated status.
- Rate limit errors are handled (e.g. backoff or user-facing message), not silent failure.

---

### Phase 7: Idea generator

**Goal:** Users can feed niche/competitor inputs (YouTube-led), get AI-generated and bounce ideas, and manage a to-do list (idea → script → produced).

**Objective:** Idea generator page with YouTube-based input, AI suggestions and bounce ideas, and a to-do list with status; optional cache for trend/summary.

**Deliverables:**

- **Inputs:** Niche/keyword and optional competitor channels (e.g. YouTube channel IDs); fetch public data via YouTube Data API (search, channel videos, public metadata); no scraping (see `.planning/research/content-idea-generation-analysis.md`).
- **AI ideas:** Call to OpenAI/Claude (or chosen provider) to suggest ideas from niche/summary; “Bounce ideas” flow: seed idea → model returns variations/angles (iterative).
- **To-do list:** Ideas stored in DB (or file-based); status pipeline: Idea | Script | Produced; list view with filters and status update; optional “Bounce this” from to-do item.
- **Optional:** Cached “niche summary” or trend summary with TTL to reduce API calls and latency.
- **Compliance:** No scraping; only official APIs and public data; respect YouTube quota (10k/day default) and document limits.

**References:**

- `.planning/research/content-idea-generation-analysis.md` — ToS, YouTube/X/Instagram/TikTok constraints, bounce ideas, to-do list.
- `.planning/SUMMARY.md` §5 — Idea generator scope; §2 — YouTube as primary for niche/competitor.

**Success criteria:**

- User can enter a niche/keyword and optional YouTube channel IDs and see a summary or list of relevant public content (e.g. titles, metrics).
- User can request “suggest ideas” and get AI-generated ideas; user can “bounce” an idea and get variations.
- User can add ideas to a to-do list and move them through Idea → Script → Produced.
- No scraping; only allowed APIs and public data; quota and limits documented or surfaced where relevant.

---

## 4. Suggested phase order (from research)

Order is dependency-driven:

1. **Foundation** — App, auth, DB, routes, design system.
2. **Dashboard** — 1–2 platforms, toggles, combined stats.
3. **Content model & planner UI** — Data model and planner without publish.
4. **Scheduler & first platform** — Queue + one platform (e.g. Instagram or X).
5. **Media & calendar** — Vercel Blob, calendar UI.
6. **Retries & multi-platform** — Retries, retry UX, second platform.
7. **Idea generator** — YouTube input, AI bounce ideas, to-do list, optional cache.

Rationale: Foundation first; dashboard can proceed in parallel with planner design but is listed second for a single-threaded execution order. Content model must exist before scheduler; scheduler before media/calendar and retries; idea generator is largely independent and can follow or overlap with later planner work.

---

## 5. Success criteria (overall)

- **Dashboard:** User can connect 1–2 platforms, toggle them, and see combined and per-platform stats.
- **Planner:** User can create content with general body and per-platform overrides, upload media, schedule to two platforms (e.g. Instagram and X), and have posts publish at the chosen time; failed publishes can be retried from the UI.
- **Calendar:** User can view scheduled and published content in a timezone-aware calendar and reschedule (e.g. drag).
- **Idea generator:** User can input niche/competitor (YouTube-led), get AI suggestions and bounce ideas, and manage a to-do list (Idea → Script → Produced).

---

## 6. Risks & dependencies

| Risk / dependency | Mitigation |
|-------------------|------------|
| **X API cost** | Free tier (500 posts + 100 reads/month) is low; Basic ~$200/mo for production. Plan for cost or limit X to “second platform” with clear caps. |
| **Meta App Review** | Instagram + Facebook production use require App Review (~5+ business days). Start with dev/sandbox; plan review before launch. |
| **TikTok audit** | Public posting requires TikTok audit; unaudited apps = private-only. Defer TikTok to post-MVP or scope to private posts. |
| **YouTube quota** | 10k units/day default; search/list are quota-heavy. Cache where possible; request quota extension if scaling. |
| **Idea generator ToS** | No scraping. Use only YouTube Data API, manual competitor input, and allowed public data; document constraints in-app. |
| **Auth and tokens** | Store refresh tokens securely; handle expiry and “Reconnect” flows in dashboard and planner. |
| **Inngest / queue** | Ensure idempotency and retry policy; document cron/schedule limits on Vercel if not using Inngest. |

---

## 7. Progress

| Phase | Status   | Notes |
|-------|----------|--------|
| 1. Foundation | Done | App at root; Clerk, Supabase, (dashboard) routes, loading/error, dark theme |
| 2. Dashboard | Done | YouTube OAuth, tokens in Supabase, stats + toggles + combined totals |
| 3. Content model & planner UI | Done | DB, actions, planner form + list, Schedule sets scheduled_at + state |
| 4. Scheduler & first platform | Done | Inngest cron + content/publish; X OAuth + createTweet; publish_results + state |
| 5. Media & calendar | Done | Vercel Blob upload; planner media UX; react-big-calendar (month/week/agenda); drag-to-reschedule |
| 6. Retries & multi-platform | Not started | — |
| 7. Idea generator | Not started | — |
