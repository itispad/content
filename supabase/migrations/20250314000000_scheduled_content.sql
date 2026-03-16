-- Scheduled content: one entity per post, shared body + per-platform overrides (Phase 3).
-- Publish results per platform stored here for Phase 4+.
create table if not exists public.scheduled_content (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  body text,
  media_urls text[] default '{}',
  scheduled_at timestamptz,
  state text not null default 'draft' check (state in ('draft', 'scheduled', 'published')),
  target_platforms text[] not null default '{}',
  platform_overrides jsonb not null default '{}',
  publish_results jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scheduled_content_user_id_idx on public.scheduled_content (user_id);
create index if not exists scheduled_content_state_idx on public.scheduled_content (state);
create index if not exists scheduled_content_scheduled_at_idx on public.scheduled_content (scheduled_at);

alter table public.scheduled_content enable row level security;

-- Access only via service role (app enforces user_id from Clerk).
create policy "No direct client access"
  on public.scheduled_content for all
  using (false)
  with check (false);

comment on table public.scheduled_content is 'Content items for planner; draft/scheduled/published; platform_overrides per platform (caption, hashtags).';
