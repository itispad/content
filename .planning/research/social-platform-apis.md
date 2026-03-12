# Social Platform APIs & Integrations — Research

**Project:** Content Management Tool (Metricool-style)  
**Focus:** Social platform APIs for dashboard stats, content planner (scheduling/publishing), and idea generator (competitor/public content).  
**Researched:** March 2025

---

## Executive Summary

Building a Metricool-style tool means integrating **six main platforms**: Instagram, TikTok, YouTube, X (Twitter), LinkedIn, and Facebook. Each has different API maturity: **Facebook/Meta** and **YouTube** support scheduling and analytics well; **Instagram** has analytics and posting but **no native scheduling** (app-side scheduling required); **TikTok** and **X** support posting with **audit/compliance gates** and **no native scheduling**; **LinkedIn** supports posting but **creator analytics are partner-only**. For the **idea generator**, competitor/public content is **not** offered by most official APIs; TikTok and Instagram restrict scraping in ToS, so this area is high-risk and should be scoped to **own content + manual/curated inputs** or approved research/aggregator data.

---

## 1. Platform-by-Platform Summary

### 1.1 Instagram (Meta)

| Aspect | Details |
|--------|---------|
| **API** | **Instagram Graph API** (consumer Basic Display API deprecated Dec 4, 2024). |
| **Docs** | [Instagram Platform — Meta for Developers](https://developers.facebook.com/docs/instagram-platform/) |
| **Auth** | OAuth 2.0 via Meta for Developers; **Business or Creator account** required (no personal accounts). |
| **Analytics** | Yes — reach, impressions, engagement, likes, comments, saves, audience demographics, Story insights. Real-time possible (avoids 24–48h delay of native Insights). |
| **Posting** | Yes — photos, videos, Reels, Stories, carousels via media container + publish. |
| **Scheduling** | **No native scheduling.** `scheduled_publish_time` is not generally available (whitelist only). Use app-side scheduling: store publish time and call publish endpoint at that time. |
| **Rate limits** | ~**200 calls/hour per Instagram account**; **100 API-published posts per 24h** (rolling). |
| **App review** | Required for production (e.g. `instagram_business_basic`, `instagram_business_content_publish`). ~5+ business days per submission. |

**Recommendation:** Use Graph API for dashboard and publishing; implement your own scheduler (cron/queue) that triggers publish at `scheduled_publish_time`. Only connect Business/Creator accounts.

---

### 1.2 TikTok

| Aspect | Details |
|--------|---------|
| **API** | **Content Posting API** (Direct Post / Upload to Inbox). |
| **Docs** | [TikTok for Developers — Content Posting API](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post) |
| **Auth** | OAuth 2.0. |
| **Analytics** | Own-content analytics via **Login Kit** (logged-in user). No official public/competitor analytics API for idea generator. |
| **Posting** | Yes — video only (MP4/H.264, up to ~1 GB). Caption max 2,200 UTF-16 chars; privacy, Duet/Stitch, branded content, AI-generated content labels. |
| **Scheduling** | **No native scheduling.** Implement app-side: queue posts and call publish at desired time (down-to-the-second possible on your side). |
| **Rate limits** | **6 requests/minute per user access token.** |
| **Compliance** | **Unaudited apps:** posts only in **private** (`SELF_ONLY`). Public posting requires **TikTok audit** (org info, usage estimates, UX mockups, screen recordings of full flow). ~15 posts/creator/day; 5 users/24h in unaudited mode. |

**Recommendation:** Plan for audit early if you need public TikTok posting. For dashboard, use Login Kit for own-account stats only. Do not rely on official API for competitor/public content.

---

### 1.3 YouTube

| Aspect | Details |
|--------|---------|
| **APIs** | **YouTube Data API v3** (metadata, uploads, search); **YouTube Analytics API** (channel/video analytics). |
| **Docs** | [YouTube Data API](https://developers.google.com/youtube/v3), [YouTube Analytics and Reporting](https://developers.google.com/youtube/analytics) |
| **Auth** | OAuth 2.0 (e.g. `youtube.upload`, `youtube`). |
| **Analytics** | Yes — YouTube Analytics API (views, watch time, demographics, etc.). |
| **Posting** | Yes — upload via `videos.insert` (files up to 256 GB). |
| **Scheduling** | **Yes.** Set `status.privacyStatus` to `"private"` and `status.publishAt` to ISO 8601 time for future publish. |
| **Quota** | Default **10,000 units/day** per project. Upload = 1,600 units; search = 100; many read ops = 1. Unverified projects (post–Jul 2020) may have uploads restricted to private until compliance audit. |
| **Audit** | For higher quota or to remove upload restrictions: [YouTube API Services – Audit and Quota Extension](https://support.google.com/youtube/contact/yt_api_form); ~2–4 weeks. |

**Recommendation:** Use Data API for uploads + scheduling and Analytics API for dashboard. Budget quota (search is expensive); request quota extension early if scaling.

---

### 1.4 X (Twitter)

| Aspect | Details |
|--------|---------|
| **API** | **X API v2** (Manage Tweets, etc.). |
| **Docs** | [X Developer Platform](https://developer.x.com/en/docs/twitter-api) — [Manage Tweets](https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/introduction), [Rate limits](https://developer.x.com/en/docs/twitter-api/rate-limits) |
| **Auth** | OAuth 1.0a User Context or OAuth 2.0 Authorization Code with PKCE. |
| **Analytics** | Limited in API; tweet metrics depend on product tier. |
| **Posting** | Yes — POST create tweet. |
| **Scheduling** | **No native scheduling.** Implement app-side scheduling (call API at publish time). |
| **Rate limits** | **POST:** 200 req/15 min; **DELETE:** 50 req/15 min; **combined** (create/retweet): 300 per 3 hours. |
| **Tiers** | **Free:** 500 posts/month. **Basic:** $200/mo, 10k posts. **Pro:** $5k/mo, 1M posts. **Enterprise:** custom (e.g. $42k+/mo). |

**Recommendation:** Use v2 for posting; build your own scheduler. Free tier is tight for multi-user; Basic is the practical minimum for a real product.

---

### 1.5 LinkedIn

| Aspect | Details |
|--------|---------|
| **API** | **Share on LinkedIn** (UGC Posts), **Sign in**, **Analytics**. |
| **Docs** | [LinkedIn API Documentation](https://learn.microsoft.com/en-us/linkedin/) (Microsoft Learn). |
| **Auth** | OAuth 2.0. Scopes: `w_member_social`, `r_member_social`, `w_organization_social`, `r_organization_social` (profile vs org). |
| **Analytics** | **Organization/Page:** available via API. **Member (creator) post analytics:** **restricted** — `r_member_postAnalytics` / Community Management API requires **LinkedIn approval** (not self-serve). |
| **Posting** | Yes — text, images, video to `/v2/ugcPosts`. |
| **Scheduling** | No native scheduling in API; implement app-side. |

**Recommendation:** Use API for posting and for **page** analytics. For creator dashboard, either rely on page-only analytics or plan for LinkedIn partnership for member post analytics.

---

### 1.6 Facebook (Meta)

| Aspect | Details |
|--------|---------|
| **API** | **Meta Graph API** (Pages). |
| **Docs** | [Graph API — Page](https://developers.facebook.com/docs/graph-api/reference/page/), [scheduled_posts](https://developers.facebook.com/docs/graph-api/reference/page/scheduled_posts/) |
| **Auth** | Page Access Token (via Meta for Developers). |
| **Analytics** | Page insights and post metrics via Graph API. |
| **Posting** | Yes — `/{page-id}/feed` with text, images, etc. |
| **Scheduling** | **Yes.** POST with `published=false` and `scheduled_publish_time` (UNIX timestamp). List via `/{page-id}/scheduled_posts`. |
| **Rate limits** | Platform limits: hourly cap scales with app DAU. Business use-case limits apply to Pages/Instagram. |
| **Caveat** | Posts scheduled via API may not show in Meta Business Suite UI (known issue); they do appear in API and Creator Studio. |

**Recommendation:** Use Graph API for page posting and **native scheduling**; document that scheduled posts may not appear in Business Suite.

---

## 2. OAuth, Approvals, and Restrictions (Quick Reference)

| Platform | OAuth | App review / audit | Account type |
|----------|--------|--------------------|--------------|
| Instagram | OAuth 2.0 (Meta) | App Review for permissions | Business or Creator only |
| TikTok | OAuth 2.0 | Audit for public posting | Any (audit for public API posts) |
| YouTube | OAuth 2.0 | Quota/upload audit if needed | Any |
| X | OAuth 1.0a / OAuth 2.0 PKCE | Product tier (no formal review) | Any |
| LinkedIn | OAuth 2.0 | Partner approval for member analytics | Any |
| Facebook | Page token (Meta) | App Review for production | Page required |

- **Meta (Instagram + Facebook):** Single Meta for Developers app; Instagram Basic Display deprecated — use **Instagram Graph API** only.  
- **TikTok:** Unaudited = private-only posting; plan for audit for real use.  
- **YouTube:** Default 10k quota/day; unverified new projects may have uploads limited to private until audit.  
- **X:** Paid tier required for meaningful post volume (Basic $200/mo).

---

## 3. Aggregator / Third-Party APIs (Multi-Platform Simplification)

Using a **unified API** can reduce integration and maintenance cost at the expense of vendor lock-in and per-post or per-request cost.

| Provider | Coverage | Scheduling | Analytics | Notes |
|----------|----------|------------|-----------|--------|
| **Late** (getlate.dev) | 13+ (Instagram, TikTok, YouTube, X, LinkedIn, Facebook, etc.) | Yes (they handle timing) | Unified analytics | Posting + analytics; 99.97% uptime claims. |
| **Outstand** (outstand.so) | 10+ (X, LinkedIn, Instagram, TikTok, Facebook, Threads, Bluesky, YouTube, Pinterest, Google Business) | Advanced scheduling | Unified analytics | Usage-based, e.g. $5/mo for 1k posts; webhooks, rate-limit handling. |
| **SociaVault** | 25+ platforms | Yes | Yes | Single pipeline; handles platform-specific quirks. |
| **Metricool** | Own product (Facebook, Instagram, TikTok, LinkedIn, X, YouTube) | Yes | Yes; competitor analysis | Connector exists (e.g. Airbyte); not an API you “call” for your app — competitive reference. |

**Recommendation:** For MVP, direct platform APIs keep control and avoid per-post fees. Revisit aggregators (e.g. Outstand, Late) if you need to ship many platforms fast or if maintenance of 6+ integrations becomes a burden.

---

## 4. Idea Generator: Competitor & Public Content

**Requirement:** “Analyze competitors and audience/niche; suggest ideas” (and optional scraping).

| Platform | Official API for public/competitor content | Scraping / ToS |
|----------|--------------------------------------------|-----------------|
| **Instagram** | No public content or competitor API in Graph API. | ToS restricts automated data collection. Scrapers exist (e.g. Apify) but are against ToS; risk of blocks. |
| **TikTok** | **Research API** for academics only (30–90 day approval, IRB, no commercial use, ~1k req/day). Marketing API = ads only. | ToS prohibits “automated data collection”; IP bans reported. |
| **YouTube** | Data API allows **public** video metadata, search, stats (views, likes) for public videos. | Within API ToS, reading public video/list data is allowed. |
| **X** | Limited public data access; tier-dependent. | Scraping restricted by ToS. |
| **LinkedIn** | No official competitor/post discovery API for this use case. | Scraping against ToS. |

**Practical constraints:**

- **Allowed and low-risk:**  
  - **Own content** (via each platform’s API) for “analyze own content” and “bounce ideas.”  
  - **YouTube:** Public video search + public metadata/analytics for idea/trend inspiration within API.  
  - **Manual/curated** competitor URLs or handles; no automated scraping.
- **High-risk / avoid for roadmap:**  
  - Instagram/TikTok/LinkedIn/X **scraping** for competitor content (ToS and enforcement risk).  
  - Using TikTok Research API for a commercial idea generator (not allowed).

**Recommendation:** Roadmap the idea generator as: (1) **own-account** content analysis (all platforms), (2) **YouTube**-based trend/topic discovery from public data via API, (3) **manual** competitor/handle input and optional “bounce ideas” flow. Do **not** depend on scraping or competitor APIs for Instagram/TikTok/LinkedIn/X.

---

## 5. Scheduling: Native vs App-Side

| Platform | Native API scheduling | Approach for product |
|----------|------------------------|----------------------|
| **Facebook** | Yes (`scheduled_publish_time`) | Use API as-is. |
| **YouTube** | Yes (`status.publishAt` + private) | Use API as-is. |
| **Instagram** | No (whitelist only) | Store schedule in DB; cron/queue calls publish at time. |
| **TikTok** | No | Same as Instagram. |
| **X** | No | Same as Instagram. |
| **LinkedIn** | No | Same as Instagram. |

**Implementation:** One **scheduler service** (e.g. cron or queue worker) that: (1) queries “posts where `scheduled_publish_time <= now` and not yet published”, (2) calls the correct platform API (publish or, for YouTube, update to public if needed), (3) marks as published. For Facebook/YouTube you can still use the same pipeline and pass native scheduling params where supported.

---

## 6. Recommendations for Roadmap

1. **Phase platforms by value and API readiness:**  
   - **Tier 1:** Facebook, YouTube (scheduling + analytics), Instagram (analytics + post; app-side scheduling).  
   - **Tier 2:** X (post + app-side scheduling; budget for Basic tier), LinkedIn (post + page analytics).  
   - **Tier 3:** TikTok (post after audit; creator analytics via Login Kit).

2. **Unified scheduler:** Design one “scheduled post” model and a single worker that dispatches to each platform’s publish endpoint (using native scheduling for Facebook and YouTube when available).

3. **Dashboard:** Use each platform’s official APIs for **own-account** stats only; no dependency on competitor APIs for dashboard.

4. **Idea generator:**  
   - **In scope:** Own content analysis, YouTube public data (search + metadata), manual competitor input.  
   - **Out of scope for initial roadmap:** Scraping Instagram/TikTok/LinkedIn/X; TikTok Research API; any automated competitor feed.

5. **Costs and approvals:**  
   - **X:** Plan for Basic ($200/mo) or higher for production.  
   - **Meta:** One app; App Review for Instagram + Facebook.  
   - **TikTok:** Request Direct Post audit early if TikTok is required at launch.  
   - **YouTube:** Monitor quota; request quota extension if you scale.

6. **Aggregators:** Revisit Outstand or Late if you add many more networks or need to reduce integration maintenance; not required for the first 6 platforms.

---

## 7. Key Doc Links

- [Meta for Developers — Instagram](https://developers.facebook.com/docs/instagram-platform/)  
- [Meta Graph API — Rate limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/)  
- [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)  
- [YouTube Data API v3](https://developers.google.com/youtube/v3)  
- [YouTube Analytics and Reporting](https://developers.google.com/youtube/analytics)  
- [X API v2 — Manage Tweets](https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/introduction)  
- [X API — Rate limits](https://developer.x.com/en/docs/twitter-api/rate-limits)  
- [LinkedIn API (Microsoft Learn)](https://learn.microsoft.com/en-us/linkedin/)  
- [Facebook Graph API — Page scheduled_posts](https://developers.facebook.com/docs/graph-api/reference/page/scheduled_posts/)
