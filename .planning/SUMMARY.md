# Content Management Tool — Research Summary

**Project:** Metricool-style content management tool (Dashboard, Content planner, Idea generator)  
**Stack:** Next.js, Vercel, Tailwind, shadcn UI, dark mode · **Auth:** Clerk · **DB:** Supabase · **Repo:** app at repo root  
**Synthesized:** March 2025

---

## 1. Product Summary

| Area | Scope |
|------|--------|
| **Dashboard** | Per-platform stats (common metrics); enable/disable platforms for combined totals. Own-account data only via official APIs. |
| **Content planner** | One general content field + per-platform overrides (e.g. caption); schedule posts; app-side scheduling (cron/queue) for most platforms; Facebook/YouTube support native scheduling. |
| **Idea generator** | Analyze own content + YouTube public data + manual competitor input; AI-powered “bounce ideas”; to-do list (idea → script → produced). No scraping; stay within platform ToS. |

---

## 2. Social Platform APIs (from research)

- **Tier 1 (launch):** Facebook (native scheduling + analytics), YouTube (native scheduling + Analytics API), Instagram (analytics + post; app-side scheduling; Business/Creator only; App Review).
- **Tier 2:** X (post + app-side scheduling; plan for Basic $200/mo for real use), LinkedIn (post + page analytics; member post analytics partner-only).
- **Tier 3:** TikTok (post after audit; unaudited = private-only; 6 req/min; creator analytics via Login Kit).
- **Scheduling:** Only Facebook and YouTube support native API scheduling; all others need one scheduler (e.g. Inngest, Vercel Cron) that runs at publish time and calls each platform’s publish endpoint.
- **Idea generator:** Use **own content** (all platforms), **YouTube Data API** (search, channel videos, public stats), **manual** competitor/handle input. Do **not** scrape or use Instagram/TikTok/LinkedIn/X for competitor/trend analytics beyond what’s explicitly allowed (e.g. Instagram hashtag display only).

---

## 3. Content Scheduling & Multi-Platform (from researcher summary)

- **Model:** One content entity: shared body/media + `scheduledAt` + list of platforms + per-platform overrides (caption, hashtags). States: `draft` → `scheduled` → `published`; store publish result per platform (success/failure, platform post ID).
- **Platform limits:** Store caption/hashtag limits in config; validate in planner and before enqueue (e.g. Instagram 2,200/30, X 280, LinkedIn 3,000).
- **Execution:** Prefer **Inngest** (or similar) for “run at scheduled time” with step-based retries; idempotency key e.g. `publish-${contentId}-${platformId}`.
- **Media:** **Vercel Blob** (or equivalent) for uploads; pass public URLs to platform APIs (Instagram consumes URL; X may need upload from URL in job).
- **Calendar UI:** Month/week views, drag-and-drop, timezone-aware; e.g. react-big-calendar or FullCalendar styled for Tailwind/shadcn/dark.
- **Phasing:** (1) Content model + planner UI (no real publish), (2) Scheduler + one platform, (3) Instagram + X first, (4) Media pipeline (Blob + URLs), (5) Calendar UI, (6) Retries and “retry failed” UX.

---

## 4. Next.js + Vercel + shadcn (from research)

- **Router:** App Router. Route group `(dashboard)` so URLs are `/dashboard`, `/planner`, `/ideas` with one shared layout (sidebar + main).
- **Components:** shadcn Table + TanStack Table (stats, content list, ideas); shadcn Charts (Recharts) for dashboard; Form (RHF + Zod) + Server Actions for planner and ideas; Calendar + Popover for dates; next-themes + shadcn, default dark.
- **Data:** Server Components for read; Server Actions for mutations; Route Handlers for webhooks/public API. Auth (Clerk or NextAuth); check session server-side at every data access. Env vars server-only for API keys (no `NEXT_PUBLIC_`).
- **UX:** `loading.tsx` + Skeleton per segment; `error.tsx` per segment; nested Suspense for multiple async sections.

---

## 5. Idea Generator (from research)

- **Legal/ToS:** No scraping. YouTube = primary (search, channel list, public metadata); X = optional, paid for volume; Instagram = display only (hashtag); TikTok = creator-centric (user-supplied creator IDs).
- **Features:** Niche/keyword + optional competitor channels (YouTube IDs, etc.); cached “niche summary”; AI (OpenAI/Claude) for idea suggestions and “bounce ideas” (seed → variations); to-do list with status (Idea | Script | Produced); optional “Bounce this” from to-do.
- **Data:** Ideas/to-dos in DB or file-based; optional cache for trend/summary with TTL.

---

## 6. Cross-Cutting Decisions

| Topic | Decision |
|-------|----------|
| **Auth** | **Clerk**; protect layout/pages and every data access by user (`auth()` server-side). |
| **DB** | **Supabase**; store users, connected accounts/tokens, scheduled content, platform overrides, ideas/to-dos, optional trend cache. **Phase 2:** OAuth tokens for connected platforms (e.g. YouTube) stored in Supabase; first platform = YouTube. |
| **Repo** | Next.js app at repo root; deploy from root. |
| **Secrets** | Platform API keys and tokens server-only; store in env or secure storage; never in client (Clerk publishable key is the only public auth key). |
| **Job queue** | Inngest (or Vercel Cron + serverless) for scheduled publish and optional idea-generation jobs. |
| **Aggregators** | Not required for MVP; revisit Outstand/Late if many more platforms or maintenance grows. |

---

## 7. Risks & Constraints

- **X API:** Free tier (500 posts + 100 reads/month) is too low; Basic $200/mo for production.
- **Meta:** Single app; App Review for Instagram + Facebook production.
- **TikTok:** Audit required for public posting; unaudited = private-only.
- **YouTube:** 10k quota/day default; request extension if scaling; unverified projects may have upload limits.
- **Idea generator:** Do not rely on scraping or competitor APIs outside YouTube/public/manual input.

---

## 8. Research Artifacts

- `.planning/research/social-platform-apis.md` — Platform APIs, OAuth, rate limits, scheduling, idea-generator constraints.
- `.planning/research/nextjs-vercel-shadcn-dashboard.md` — App structure, components, auth, data, loading/error.
- `.planning/research/content-idea-generation-analysis.md` — ToS, techniques, bounce ideas, to-do list, MVP scope.
- Content scheduling research (researcher summary): data model, queue, media, calendar, phased rollout.
