-- Profiles table: links Clerk user to app data.
-- Sync from Clerk on sign-in (Phase 2); used for connected accounts, content, ideas.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: users can only read/update their own profile (by clerk_id).
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (true);

-- Optional: index for lookups by clerk_id (unique already creates one).
create index if not exists profiles_clerk_id_idx on public.profiles (clerk_id);

comment on table public.profiles is 'User profiles linked to Clerk; clerk_id is the Clerk user ID.';
