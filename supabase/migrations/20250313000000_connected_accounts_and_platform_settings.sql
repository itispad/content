-- Connected accounts: OAuth tokens per user per platform (Phase 2: YouTube first).
-- Server-side only (service role); RLS allows no direct client access.
create table if not exists public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  platform text not null,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  platform_user_id text,
  platform_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

create index if not exists connected_accounts_user_id_idx on public.connected_accounts (user_id);
create index if not exists connected_accounts_platform_idx on public.connected_accounts (platform);

alter table public.connected_accounts enable row level security;

-- No policies: access only via service role from server (Clerk user_id in app code).
create policy "No direct client access"
  on public.connected_accounts for all
  using (false)
  with check (false);

comment on table public.connected_accounts is 'OAuth tokens per user (Clerk user_id) per platform; server-only access.';

-- User platform settings: which platforms to include in combined dashboard totals.
create table if not exists public.user_platform_settings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  platform text not null,
  enabled_for_totals boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

create index if not exists user_platform_settings_user_id_idx on public.user_platform_settings (user_id);

alter table public.user_platform_settings enable row level security;

create policy "No direct client access settings"
  on public.user_platform_settings for all
  using (false)
  with check (false);

comment on table public.user_platform_settings is 'Per-user toggle: include platform in combined totals; server-only access.';

-- Cached platform stats (optional): reduce API calls; TTL ~15–30 min.
create table if not exists public.platform_stats (
  id uuid primary key default gen_random_uuid(),
  connected_account_id uuid not null references public.connected_accounts (id) on delete cascade,
  subscribers bigint default 0,
  views bigint default 0,
  engagement_count bigint default 0,
  video_count bigint default 0,
  fetched_at timestamptz not null default now(),
  unique (connected_account_id)
);

create index if not exists platform_stats_fetched_at_idx on public.platform_stats (fetched_at);

alter table public.platform_stats enable row level security;

create policy "No direct client access stats"
  on public.platform_stats for all
  using (false)
  with check (false);

comment on table public.platform_stats is 'Cached stats per connected account; server-only.';
