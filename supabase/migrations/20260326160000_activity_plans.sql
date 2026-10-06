-- =============================================================================
-- Vemee — activity plans, participants, connections, approx location
-- =============================================================================

do $$ begin
  create type public.plan_visibility as enum ('public', 'community');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_participant_status as enum ('joined', 'interested', 'left');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.connection_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists approx_lat double precision,
  add column if not exists approx_lng double precision,
  add column if not exists location_area text,
  add column if not exists location_source text;

comment on column public.profiles.approx_lat is
  'Approximate latitude for discovery only — never expose exact coords in UI.';
comment on column public.profiles.approx_lng is
  'Approximate longitude for discovery only — never expose exact coords in UI.';

create table if not exists public.activity_plans (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  title text not null,
  description text not null,
  image_key text not null,
  image_url text,
  plan_date date not null,
  plan_time time not null,
  location_label text not null,
  city text,
  lat double precision,
  lng double precision,
  people_needed smallint not null check (people_needed between 1 and 5),
  visibility public.plan_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists activity_plans_creator_idx
  on public.activity_plans (creator_id, created_at desc);
create index if not exists activity_plans_date_idx
  on public.activity_plans (plan_date, category);

create table if not exists public.plan_participants (
  plan_id uuid not null references public.activity_plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.plan_participant_status not null default 'joined',
  joined_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id),
  unique (requester_id, recipient_id)
);

create index if not exists connections_recipient_idx
  on public.connections (recipient_id, status);

alter table public.activity_plans enable row level security;
alter table public.plan_participants enable row level security;
alter table public.connections enable row level security;

drop policy if exists "plans_select_public" on public.activity_plans;
create policy "plans_select_public" on public.activity_plans
  for select using (visibility = 'public' or creator_id = auth.uid() or public.is_admin());

drop policy if exists "plans_insert_own" on public.activity_plans;
create policy "plans_insert_own" on public.activity_plans
  for insert with check (creator_id = auth.uid());

drop policy if exists "plans_update_own" on public.activity_plans;
create policy "plans_update_own" on public.activity_plans
  for update using (creator_id = auth.uid());

drop policy if exists "plan_participants_select" on public.plan_participants;
create policy "plan_participants_select" on public.plan_participants
  for select using (true);

drop policy if exists "plan_participants_insert_self" on public.plan_participants;
create policy "plan_participants_insert_self" on public.plan_participants
  for insert with check (user_id = auth.uid());

drop policy if exists "connections_select_parties" on public.connections;
create policy "connections_select_parties" on public.connections
  for select using (
    requester_id = auth.uid() or recipient_id = auth.uid() or public.is_admin()
  );

drop policy if exists "connections_insert_requester" on public.connections;
create policy "connections_insert_requester" on public.connections
  for insert with check (requester_id = auth.uid());

drop policy if exists "connections_update_parties" on public.connections;
create policy "connections_update_parties" on public.connections
  for update using (
    requester_id = auth.uid() or recipient_id = auth.uid()
  );
