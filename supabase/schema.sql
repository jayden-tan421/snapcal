-- ============================================================================
-- SnapCal database schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query)
-- on a fresh project. Safe to re-run: every statement is idempotent.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- log_access: sharing / permissions. An owner invites a viewer (by user id,
-- resolved from email via find_user_id_by_email below). View-only for now.
-- Created first (table only, no policies yet) because profiles' RLS policy
-- below references it.
-- ----------------------------------------------------------------------------
create table if not exists public.log_access (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  viewer_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, viewer_id),
  check (owner_id <> viewer_id)
);

alter table public.log_access enable row level security;

-- ----------------------------------------------------------------------------
-- profiles: one row per auth user. Holds app-level settings (calorie goal)
-- and a copy of the email so we can look users up for sharing invites
-- without ever exposing auth.users to the client.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  daily_calorie_goal integer not null default 2000,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own or shared-with-me" on public.profiles;
create policy "profiles: read own or shared-with-me"
  on public.profiles for select
  using (
    id = auth.uid()
    -- Either side of ANY log_access relationship (any status) can see the
    -- other's profile — an owner needs to see who they invited before the
    -- invite is accepted, and a viewer needs to see who invited them.
    or exists (
      select 1 from public.log_access
      where (log_access.owner_id = profiles.id and log_access.viewer_id = auth.uid())
         or (log_access.viewer_id = profiles.id and log_access.owner_id = auth.uid())
    )
  );

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (id = auth.uid());

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- meals: the core log. One row per logged meal (AI-analyzed or manual).
-- Photos are never persisted — analysis happens in-memory server-side —
-- so image_url stays nullable and unused today, reserved for later.
-- ----------------------------------------------------------------------------
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  image_url text,
  items jsonb not null default '[]'::jsonb,
  total_calories numeric not null default 0,
  total_protein_g numeric not null default 0,
  total_carbs_g numeric not null default 0,
  total_fat_g numeric not null default 0,
  notes text,
  source text not null default 'manual' check (source in ('ai', 'manual')),
  confidence text check (confidence in ('low', 'medium', 'high'))
);

create index if not exists meals_user_id_created_at_idx
  on public.meals (user_id, created_at desc);

alter table public.meals enable row level security;

drop policy if exists "meals: read own or shared-with-me" on public.meals;
create policy "meals: read own or shared-with-me"
  on public.meals for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.log_access
      where log_access.owner_id = meals.user_id
        and log_access.viewer_id = auth.uid()
        and log_access.status = 'accepted'
    )
  );

drop policy if exists "meals: insert own" on public.meals;
create policy "meals: insert own"
  on public.meals for insert
  with check (user_id = auth.uid());

drop policy if exists "meals: update own" on public.meals;
create policy "meals: update own"
  on public.meals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "meals: delete own" on public.meals;
create policy "meals: delete own"
  on public.meals for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- log_access RLS policies (table itself was created at the top of this file)
-- ----------------------------------------------------------------------------
drop policy if exists "log_access: read own relationships" on public.log_access;
create policy "log_access: read own relationships"
  on public.log_access for select
  using (owner_id = auth.uid() or viewer_id = auth.uid());

drop policy if exists "log_access: owner creates invite" on public.log_access;
create policy "log_access: owner creates invite"
  on public.log_access for insert
  with check (owner_id = auth.uid());

-- Owner can update (e.g. revoke) their own invites; viewer can update (e.g.
-- accept/decline) invites addressed to them. Application logic is
-- responsible for only setting the transitions that make sense per role.
drop policy if exists "log_access: owner or viewer updates" on public.log_access;
create policy "log_access: owner or viewer updates"
  on public.log_access for update
  using (owner_id = auth.uid() or viewer_id = auth.uid())
  with check (owner_id = auth.uid() or viewer_id = auth.uid());

drop policy if exists "log_access: owner deletes invite" on public.log_access;
create policy "log_access: owner deletes invite"
  on public.log_access for delete
  using (owner_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists log_access_set_updated_at on public.log_access;
create trigger log_access_set_updated_at
  before update on public.log_access
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- find_user_id_by_email: lets a logged-in user resolve another registered
-- user's id from their email address to invite them, without exposing the
-- full auth.users/profiles table for arbitrary browsing.
-- ----------------------------------------------------------------------------
create or replace function public.find_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select id from public.profiles where lower(email) = lower(lookup_email) limit 1;
$$;

revoke all on function public.find_user_id_by_email(text) from public;
grant execute on function public.find_user_id_by_email(text) to authenticated;

-- ============================================================================
-- Done. Next: create a Storage bucket is NOT required — SnapCal analyzes
-- photos in-memory and never writes them to Storage, so there's nothing to
-- provision there.
-- ============================================================================
