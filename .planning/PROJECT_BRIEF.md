# Content Management Tool — Project Brief

## One-liner
A content management tool (Metricool-style) with dashboard, multi-platform planner, and idea generator.

## What it is
- **Dashboard**: View all accounts, track statistics, manage content publishing. Enable/disable platforms to see combined totals.
- **Content planner**: Schedule content across platforms simultaneously. General content field + platform-specific overrides (e.g. captions).
- **Idea generator**: Scrape/analyze own content and competitors in the niche; spark new ideas; optional back-and-forth (bounce ideas).

## Problem
Using multiple platforms to manage content, view performance overall and per platform, and generate new ideas is fragmented.

## Solution
A single web app with three core areas:
1. **Dashboard** — Stats from each platform + overall view; toggle platforms for combined totals.
2. **Content planner** — Upload/schedule content; one general field + per-platform settings (e.g. caption).
3. **Idea generator** — Analyze competitors and audience/niche; suggest ideas; to-do list for video/content ideas; bounce ideas.

## Key features
- Dashboard: common stats per platform; enable/disable platforms for combined totals.
- Content planner: schedule posts; general content field; per-platform caption/settings.
- Idea generator: analyze competitors on platforms; analyze audience/niche needs; build to-do list of video/content ideas.

## Tech stack
- **Frontend/backend**: Next.js, Vercel
- **Styling**: Tailwind, shadcn UI, dark mode
- **Auth**: Clerk
- **Database**: Supabase
- **Repo**: Next.js app at repo root
- **Integrations**: Platform APIs for each channel (social networks)

## Out of scope for initial brief
- Exact list of platforms (to be informed by research)
- Auth and billing (can be added in roadmap phases)
