# Content Analysis and Idea Generation — Research

**Project:** Content Management Tool (Metricool-style)  
**Focus:** Idea generator — competitor/niche analysis, idea capture, bounce ideas, to-do list  
**Researched:** March 2025  
**Confidence:** HIGH for platform ToS/APIs; MEDIUM for third-party data providers

---

## Executive Summary

The idea generator can be built **legally and within ToS** by relying on **official APIs and RSS** for public data, plus **AI APIs** to summarize and generate ideas from that data. **Scraping** is generally prohibited by platform ToS; competitor and niche analysis should use **YouTube Data API**, **X API** (with tight free-tier limits), **TikTok Display API** (creator-centric, not search), **Instagram** only for display of public content (not metrics), and **YouTube RSS** for channel feeds. “Bounce ideas” fits a **chat or form → AI variations** flow; the to-do list is a **simple status pipeline** (idea → script → produced). **Minimal storage** (ideas, to-dos, optional cached trend summaries) is sufficient for MVP—DB or file-based both viable.

---

## 1. Legal and ToS: What Can We Scrape or Access?

### 1.1 Golden Rule

- **Do not scrape.** All major platforms forbid unauthorized automated collection in their ToS. Use **official APIs** and **public RSS** only.
- **Competitor/niche analysis** = use APIs to read **public** posts/videos and, where allowed, **public engagement metrics**. Restrictions below are platform-specific.

### 1.2 Platform-by-Platform

| Platform   | Public data allowed (APIs / RSS) | Restrictions |
|-----------|-----------------------------------|-------------|
| **YouTube** | ✅ **YouTube Data API v3**: search by keyword/topic, channel videos, public metadata (title, description, view count, like count, comment count). **RSS**: per-channel feed `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID` for new uploads (no engagement). | Quota: 10,000 units/day default; `search.list` = 100 units/request. No “trending” endpoint; trends inferred from search + sort by viewCount/date. |
| **X (Twitter)** | ✅ **X API v2**: recent search by keyword/hashtag (`/2/tweets/search/recent`), public tweet text and engagement. | **Free tier**: 500 Posts + 100 Reads per month—effectively unusable for ongoing analysis. Paid Basic ~$200/mo for meaningful volume. |
| **Instagram** | ⚠️ **Instagram Graph API**: Hashtag Search (recent_media, top_media) and Public Content Access **only for discovering/displaying** public content. | **Cannot** use this for metrics, insights, trends, or sentiment. App Review + “Instagram Public Content Access” required; 30 hashtags per 7 days. Use for “content in niche” display, not analytics. |
| **TikTok** | ✅ **Display API** (commercial): public profile + **video list** for a **specific user** by ID. ❌ No general search/hashtag API for commercial apps. **Research API**: hashtag/keyword search + engagement, but **academic/non-profit only**. | For “competitor” analysis: only if user adds **specific creator IDs**; no “search all TikTok by niche” without Research API eligibility. |

### 1.3 Summary of Constraints

- **Scraping:** Not allowed (ToS). Do not build a scraper for Instagram/TikTok/X/YouTube.
- **YouTube:** Best for MVP—search by keyword, channel RSS, public stats via API; quota management required.
- **X:** Free tier too low for real “niche” monitoring; treat as optional/paid.
- **Instagram:** Public content discovery only; no engagement/trend analytics via this API.
- **TikTok:** Creator-centric (list videos by creator ID); no commercial keyword/hashtag search.

---

## 2. Techniques for Content and Idea Generation

### 2.1 Sourcing “Content in My Niche”

- **YouTube**
  - **API:** `search.list` with `q` (keyword) and/or `topicId`; order by `viewCount` or `date`; cache titles, descriptions, thumbnails, view/like/comment counts.
  - **RSS:** For known competitor or niche channels, subscribe to `feeds/videos.xml?channel_id=...` for new uploads (no API quota for reads).
- **X**
  - Use **search/recent** with hashtag or keyword; free tier allows only 100 reads/month—use sparingly or as paid add-on.
- **Instagram**
  - If approved for Public Content Access: hashtag search → recent/top media for **display** only; avoid storing or computing engagement for “analytics.”
- **TikTok**
  - For known competitors: **Display API** → `video/list` for that creator; no keyword/hashtag discovery without Research API.

### 2.2 Keyword / Hashtag “Trends”

- **YouTube:** No official “trending” API. Approximate by:
  - Search by keyword → sort by `viewCount` or `date`; track which keywords/channels appear often in cached results.
- **X:** Search recent tweets by hashtag/keyword; free tier limits make “trending” over time expensive.
- **Instagram:** Hashtag search returns recent/top media; ToS does **not** allow using this for trend/engagement analytics—only discovery/display.
- **TikTok:** No commercial trend/hashtag API; Research API has trend-like data but is not for commercial products.

**MVP recommendation:** Use **YouTube search + RSS** as the primary “niche/competitor” input; optionally add **X** with clear “limited by free tier” or paid; treat Instagram as “show posts by hashtag” only; TikTok as “show this creator’s videos” when user supplies creator IDs.

### 2.3 Engagement Metrics from Public Data

- **YouTube:** ✅ Public metrics (views, likes, comments) via API—use for “what performs” in niche.
- **X:** ✅ Public engagement in tweet objects (when using API).
- **Instagram:** ❌ Do not use Public Content Access to derive metrics or insights.
- **TikTok:** Display API returns video list; confirm in current docs whether view/like counts are in response (if yes, acceptable for “competitor” view).

### 2.4 Using AI to Summarize and Generate Ideas

- **Inputs:** Titles, descriptions, hashtags, or short text snippets obtained **via APIs or RSS** (not scraped). User-provided prompts (e.g. “fitness niche,” “competitor X”).
- **APIs:** OpenAI, Anthropic (Claude), etc. **ToS:** Sending public, non-personal snippets for summarization or idea generation is standard use; do not send private or credential data. OpenAI does not train on API input by default; check Anthropic/others for data usage.
- **Techniques:**
  - **Summarize “what’s working”:** e.g. “From these titles/descriptions, what topics and formats appear most?”  
  - **Generate ideas:** “Given this niche and these examples, suggest 10 video ideas.”  
  - **Bounce ideas:** User seed idea → model returns variations, angles, or follow-up questions (iterative refinement).

---

## 3. UX: Bounce Ideas and To-Do List

### 3.1 Bounce Ideas

- **Concept:** User provides a **seed idea**; system returns **variations, angles, or refinements** in a conversational or form-driven way.
- **Options:**
  - **Chat UI:** User messages “I want to do a video on morning routines”; assistant replies with 3–5 angles (e.g. “5-min vs 30-min,” “for remote workers,” “with kids”) and can continue the thread.
  - **Form + results:** Single text field “Your idea” → Submit → One-shot list of variations; optional “Refine” that sends the chosen variation back as new seed.
- **Implementation:** Stateless or short-lived conversation; prompt + seed (and optional niche/competitor context) → LLM API → display variations. No need for full CMS—focus on **capture and variation**, not publishing.

### 3.2 To-Do List for Videos / Content

- **Purpose:** Track ideas from **idea → script → produced** (or similar pipeline).
- **Model:** Simple list; each item has **title**, **status** (e.g. Idea | Script | Produced), optional **notes** and **source** (e.g. “from bounce ideas” or “from competitor analysis”).
- **UX:** List view with status filter or kanban-style columns; add/edit/delete; optional link to “bounce” an item (send title/notes to idea generator).
- **Scope:** No full CMS—no media storage, scheduling, or platform posting in this list; just **idea capture and status**.

---

## 4. Data Storage (MVP)

- **Needed:**
  - **Ideas / to-dos:** Title, status, notes, timestamps, optional link to “source” (e.g. competitor URL or analysis run).
  - **Optional:** Cached **trend summaries** or **niche summaries** (e.g. “Last 7 days: top keywords, top channels”) to avoid re-calling APIs on every load; TTL e.g. 24h.
- **Options:**
  - **DB:** SQLite, Postgres, or Vercel Postgres; one table for ideas/to-dos, one for cache if needed.
  - **File-based:** JSON or SQLite file in repo or on server; sufficient for single-user or very small team MVP.
- **Do not store:** Raw scraped pages; only **API responses or derived summaries** obtained via approved methods. Keep PII minimal (e.g. only what user enters for their own ideas).

---

## 5. Constraints Summary

| Area | Constraint |
|------|------------|
| **Scraping** | Do not scrape; use only official APIs and public RSS. |
| **Instagram** | Public content display only; no metrics/insights/trends from API. |
| **TikTok** | Creator-based only (Display API); no commercial keyword/hashtag search. |
| **X** | Free tier too low for real niche monitoring; plan for paid or “limited” feature. |
| **YouTube** | Quota limits (10k units/day); use search + channel RSS; no official “trending” endpoint. |
| **AI** | Use only public or user-provided text; comply with provider ToS (no credential/private data). |

---

## 6. Recommended MVP Scope

1. **Idea generator**
   - **Input:** User-defined niche/keywords + optional “competitor” channels (YouTube channel IDs; optionally X handles or TikTok creator IDs if supported by chosen APIs).
   - **Data:** YouTube Data API (search by keyword, channel videos) + YouTube RSS for new uploads; optional X search if within free tier or paid.
   - **Output:** Cached “niche summary” (e.g. recent titles, top-performing topics) and **AI-generated idea suggestions** from that context + user prompt.

2. **Bounce ideas**
   - **Flow:** User enters seed idea (chat or form) → backend sends to OpenAI/Claude with system prompt (e.g. “You are a content idea assistant”) → return 3–5 variations or follow-up questions; optional multi-turn for refinement.
   - **Storage:** Optional save of seed + variations into “ideas” list.

3. **To-do list**
   - **Model:** Ideas with status: e.g. Idea | Script | Produced; title, notes, created/updated.
   - **Actions:** Add, edit, delete, change status; optional “Bounce this” that pre-fills idea generator.

4. **Data**
   - **Storage:** DB or file-based; tables/files: ideas (to-dos), optional cache for trend/summary (with TTL).
   - **No:** Full media CMS, scheduling, or publishing in this phase.

5. **Defer**
   - Instagram/TikTok in-depth “analytics”; X at scale; any scraping; full content calendar or multi-platform publishing (handled elsewhere in product).

---

## 7. Sources

- YouTube API Services Terms of Service, Developer Policies, Quota Calculator, Search list: [Google for Developers](https://developers.google.com/youtube/terms/api-services-terms-of-service), [YouTube Data API v3](https://developers.google.com/youtube/v3/getting-started), [search.list](https://developers.google.com/youtube/v3/docs/search/list).
- YouTube channel RSS: public feed `feeds/videos.xml?channel_id=...`; no auth required.
- X API v2: [Recent Search](https://developer.x.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent), [Rate limits](https://developer.x.com/en/docs/twitter-api/rate-limits), [Pricing](https://developer.x.com/en/support/x-api/v2).
- Instagram: [Hashtag Search](https://developers.facebook.com/docs/instagram-api/reference/ig-hashtag-search), [Public Content Access](https://developers.facebook.com/docs/features-reference/instagram-public-content-access), [App Review](https://developers.facebook.com/docs/instagram-platform/app-review/); restriction on metrics/analytics from community/rejection guidance.
- TikTok: [Display API](https://developers.tiktok.com/doc/display-api-overview), [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post), [Research API](https://developers.tiktok.com/doc/research-api-specs-query-videos/) (academic/non-profit).
- OpenAI: [Terms of Use](https://openai.com/policies/row-terms-of-use), [How your data is used](https://openai.com/policies/how-your-data-is-used-to-improve-model-performance).
- Anthropic: [Model training notice](https://www.anthropic.com/legal/model-training-notice).
