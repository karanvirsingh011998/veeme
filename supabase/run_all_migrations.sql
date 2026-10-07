-- =============================================================================
-- Vemee — run all migrations (ordered)
-- Project: gzikmwhoddwbstoqlghy
-- Paste into Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- >>> 1/3 initial_schema
-- =============================================================================
-- Vemee — initial Supabase schema (MVP)
-- Source: Vemee Product UI Feature Specification + prototype data model
-- Run via: supabase db push | supabase migration up | SQL editor
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.account_status as enum ('active', 'suspended', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('none', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_type as enum ('phone', 'identity', 'face');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.category_slug as enum (
    'travel', 'workout', 'food', 'events', 'gaming', 'study', 'communities', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.listing_type as enum ('person', 'experience', 'group');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.listing_status as enum ('draft', 'active', 'paused', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum (
    'requested', 'accepted', 'declined', 'paid', 'cancelled', 'completed', 'disputed', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('upi', 'card', 'net_banking', 'wallet', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.chat_type as enum ('direct', 'group', 'booking', 'support');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.moment_type as enum ('looking_for', 'plan', 'experience', 'update');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_reason as enum (
    'spam', 'harassment', 'fake_profile', 'fraud', 'inappropriate', 'illegal', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'reviewing', 'actioned', 'dismissed', 'appealed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.checkin_status as enum ('scheduled', 'started', 'ended', 'missed', 'escalated');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  phone_verified_at timestamptz,
  email text,
  display_name text,
  first_name text,
  bio text,
  city text,
  country_code text default 'IN',
  avatar_url text,
  languages text[] default '{}',
  interests text[] default '{}',
  date_of_birth date,
  age_confirmed_18 boolean not null default false,
  is_provider boolean not null default false,
  trust_score numeric(4,2) default 0 check (trust_score >= 0 and trust_score <= 100),
  response_rate numeric(5,2) default 0,
  completed_bookings_count integer not null default 0,
  account_status public.account_status not null default 'active',
  profile_completion_pct smallint not null default 0 check (profile_completion_pct between 0 and 100),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_city_idx on public.profiles (city);
create index if not exists profiles_account_status_idx on public.profiles (account_status);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, email, display_name, age_confirmed_18)
  values (
    new.id,
    new.phone,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'first_name'),
    coalesce((new.raw_user_meta_data->>'age_confirmed_18')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Verification
-- -----------------------------------------------------------------------------
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.verification_type not null,
  status public.verification_status not null default 'pending',
  provider text,
  external_ref text,
  evidence_url text,
  notes text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type)
);

create index if not exists verifications_user_idx on public.verifications (user_id);
create index if not exists verifications_status_idx on public.verifications (status);

drop trigger if exists verifications_set_updated_at on public.verifications;
create trigger verifications_set_updated_at
  before update on public.verifications
  for each row execute function public.set_updated_at();

-- Convenience view for badges
create or replace view public.profile_badges as
select
  p.id as user_id,
  exists (
    select 1 from public.verifications v
    where v.user_id = p.id and v.type = 'phone' and v.status = 'verified'
  ) as phone_verified,
  exists (
    select 1 from public.verifications v
    where v.user_id = p.id and v.type = 'identity' and v.status = 'verified'
  ) as identity_verified,
  exists (
    select 1 from public.verifications v
    where v.user_id = p.id and v.type = 'face' and v.status = 'verified'
  ) as face_verified
from public.profiles p;

-- -----------------------------------------------------------------------------
-- Listings / experiences / group plans
-- -----------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  type public.listing_type not null default 'experience',
  category public.category_slug not null default 'other',
  title text not null,
  description text,
  city text,
  location_label text,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'INR',
  max_participants integer not null default 1 check (max_participants between 1 and 10),
  joined_count integer not null default 0 check (joined_count >= 0),
  icon text,
  cover_url text,
  tags text[] default '{}',
  cancellation_policy text,
  status public.listing_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  is_boosted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_host_idx on public.listings (host_id);
create index if not exists listings_category_status_idx on public.listings (category, status);
create index if not exists listings_starts_at_idx on public.listings (starts_at);

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create table if not exists public.listing_availability (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists listing_availability_listing_idx
  on public.listing_availability (listing_id, starts_at);

-- -----------------------------------------------------------------------------
-- Communities
-- -----------------------------------------------------------------------------
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category public.category_slug not null default 'communities',
  description text,
  icon text,
  cover_url text,
  created_by uuid references public.profiles (id) on delete set null,
  member_count integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists community_members_user_idx on public.community_members (user_id);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  media_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_community_idx
  on public.community_posts (community_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Moments (lightweight social / For You feed)
-- -----------------------------------------------------------------------------
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type public.moment_type not null default 'looking_for',
  category public.category_slug not null default 'other',
  title text not null,
  body text not null,
  city text,
  cta_label text,
  media_url text,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moments_feed_idx on public.moments (created_at desc)
  where is_hidden = false;

create table if not exists public.moment_likes (
  moment_id uuid not null references public.moments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (moment_id, user_id)
);

create table if not exists public.moment_comments (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Chat
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.chat_type not null default 'direct',
  title text,
  booking_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  muted boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text,
  image_url text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- Bookings & payments
-- -----------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete restrict,
  booker_id uuid not null references public.profiles (id) on delete restrict,
  host_id uuid not null references public.profiles (id) on delete restrict,
  status public.booking_status not null default 'requested',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  location_label text,
  participants integer not null default 1 check (participants >= 1),
  price_cents integer not null check (price_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  currency text not null default 'INR',
  cancellation_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists bookings_booker_idx on public.bookings (booker_id, created_at desc);
create index if not exists bookings_host_idx on public.bookings (host_id, created_at desc);
create index if not exists bookings_status_idx on public.bookings (status);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Optional FK from conversations.booking_id now that bookings exists
alter table public.conversations
  drop constraint if exists conversations_booking_id_fkey;
alter table public.conversations
  add constraint conversations_booking_id_fkey
  foreign key (booking_id) references public.bookings (id) on delete set null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  payer_id uuid not null references public.profiles (id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'INR',
  method public.payment_method not null default 'upi',
  status public.payment_status not null default 'pending',
  provider text,
  provider_payment_id text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  reason text,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Reviews / ratings
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating numeric(2,1) not null check (rating >= 1 and rating <= 5),
  body text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (booking_id, reviewer_id)
);

create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Safety: blocks, reports, check-ins
-- -----------------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  moment_id uuid references public.moments (id) on delete set null,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'open',
  moderator_id uuid references public.profiles (id),
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

create table if not exists public.safety_checkins (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  trusted_contact_name text,
  trusted_contact_phone text,
  status public.checkin_status not null default 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists safety_checkins_booking_idx on public.safety_checkins (booking_id);

-- -----------------------------------------------------------------------------
-- Seed categories helper (optional marketing/reference data)
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  slug public.category_slug primary key,
  label text not null,
  icon text not null,
  sort_order smallint not null default 0
);

insert into public.categories (slug, label, icon, sort_order) values
  ('travel', 'Travel', '✈️', 1),
  ('workout', 'Workout', '🏋️', 2),
  ('food', 'Food', '☕', 3),
  ('events', 'Events', '🎟️', 4),
  ('gaming', 'Gaming', '🎮', 5),
  ('study', 'Study', '📚', 6),
  ('communities', 'Communities', '👥', 7),
  ('other', 'More', '•••', 8)
on conflict (slug) do update
  set label = excluded.label,
      icon = excluded.icon,
      sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Useful queries (also documented in supabase/QUERIES.sql)
-- -----------------------------------------------------------------------------
-- Discover active listings by category:
--   select * from public.listings
--   where status = 'active' and category = 'travel'
--   order by is_boosted desc, starts_at nulls last, created_at desc;

-- People you may connect with (verified providers):
--   select p.*, b.phone_verified, b.identity_verified
--   from public.profiles p
--   join public.profile_badges b on b.user_id = p.id
--   where p.account_status = 'active' and b.phone_verified = true
--   order by p.trust_score desc nulls last
--   limit 20;
-- >>> 2/3 rls_policies
-- =============================================================================
-- Vemee — Row Level Security policies (MVP baseline)
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.verifications enable row level security;
alter table public.listings enable row level security;
alter table public.listing_availability enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.moments enable row level security;
alter table public.moment_likes enable row level security;
alter table public.moment_comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.reviews enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.safety_checkins enable row level security;
alter table public.categories enable row level security;

-- Profiles
drop policy if exists "profiles_select_active" on public.profiles;
create policy "profiles_select_active" on public.profiles
  for select using (
    account_status = 'active'
    or auth.uid() = id
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Verifications: users read own; insert/update typically via service role / edge functions
drop policy if exists "verifications_select_own" on public.verifications;
create policy "verifications_select_own" on public.verifications
  for select using (auth.uid() = user_id);

drop policy if exists "verifications_insert_own" on public.verifications;
create policy "verifications_insert_own" on public.verifications
  for insert with check (auth.uid() = user_id);

-- Listings
drop policy if exists "listings_select_active_or_host" on public.listings;
create policy "listings_select_active_or_host" on public.listings
  for select using (status = 'active' or auth.uid() = host_id);

drop policy if exists "listings_insert_own" on public.listings;
create policy "listings_insert_own" on public.listings
  for insert with check (auth.uid() = host_id);

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own" on public.listings
  for update using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

drop policy if exists "listing_availability_select" on public.listing_availability;
create policy "listing_availability_select" on public.listing_availability
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'active' or l.host_id = auth.uid())
    )
  );

drop policy if exists "listing_availability_manage_host" on public.listing_availability;
create policy "listing_availability_manage_host" on public.listing_availability
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.host_id = auth.uid()
    )
  );

-- Communities
drop policy if exists "communities_select_public" on public.communities;
create policy "communities_select_public" on public.communities
  for select using (is_public = true or created_by = auth.uid());

drop policy if exists "communities_insert_auth" on public.communities;
create policy "communities_insert_auth" on public.communities
  for insert with check (auth.uid() = created_by);

drop policy if exists "community_members_select" on public.community_members;
create policy "community_members_select" on public.community_members
  for select using (true);

drop policy if exists "community_members_join_self" on public.community_members;
create policy "community_members_join_self" on public.community_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "community_members_leave_self" on public.community_members;
create policy "community_members_leave_self" on public.community_members
  for delete using (auth.uid() = user_id);

drop policy if exists "community_posts_select" on public.community_posts;
create policy "community_posts_select" on public.community_posts
  for select using (true);

drop policy if exists "community_posts_insert_member" on public.community_posts;
create policy "community_posts_insert_member" on public.community_posts
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.community_members m
      where m.community_id = community_posts.community_id
        and m.user_id = auth.uid()
    )
  );

-- Moments
drop policy if exists "moments_select_visible" on public.moments;
create policy "moments_select_visible" on public.moments
  for select using (is_hidden = false or auth.uid() = author_id);

drop policy if exists "moments_insert_own" on public.moments;
create policy "moments_insert_own" on public.moments
  for insert with check (auth.uid() = author_id);

drop policy if exists "moments_update_own" on public.moments;
create policy "moments_update_own" on public.moments
  for update using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "moment_likes_select" on public.moment_likes;
create policy "moment_likes_select" on public.moment_likes
  for select using (true);

drop policy if exists "moment_likes_own" on public.moment_likes;
create policy "moment_likes_own" on public.moment_likes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "moment_comments_select" on public.moment_comments;
create policy "moment_comments_select" on public.moment_comments
  for select using (true);

drop policy if exists "moment_comments_insert" on public.moment_comments;
create policy "moment_comments_insert" on public.moment_comments
  for insert with check (auth.uid() = author_id);

-- Chat: participants only
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = id and p.user_id = auth.uid()
    )
  );

drop policy if exists "conversation_participants_select" on public.conversation_participants;
create policy "conversation_participants_select" on public.conversation_participants
  for select using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = conversation_participants.conversation_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = messages.conversation_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = messages.conversation_id
        and p.user_id = auth.uid()
    )
  );

-- Bookings / payments
drop policy if exists "bookings_select_parties" on public.bookings;
create policy "bookings_select_parties" on public.bookings
  for select using (auth.uid() = booker_id or auth.uid() = host_id);

drop policy if exists "bookings_insert_booker" on public.bookings;
create policy "bookings_insert_booker" on public.bookings
  for insert with check (auth.uid() = booker_id);

drop policy if exists "bookings_update_parties" on public.bookings;
create policy "bookings_update_parties" on public.bookings
  for update using (auth.uid() = booker_id or auth.uid() = host_id)
  with check (auth.uid() = booker_id or auth.uid() = host_id);

drop policy if exists "payments_select_payer_or_host" on public.payments;
create policy "payments_select_payer_or_host" on public.payments
  for select using (
    auth.uid() = payer_id
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.host_id = auth.uid()
    )
  );

drop policy if exists "reviews_select_public_or_party" on public.reviews;
create policy "reviews_select_public_or_party" on public.reviews
  for select using (
    is_public = true
    or auth.uid() = reviewer_id
    or auth.uid() = reviewee_id
  );

drop policy if exists "reviews_insert_reviewer" on public.reviews;
create policy "reviews_insert_reviewer" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- Blocks / reports / check-ins
drop policy if exists "blocks_own" on public.blocks;
create policy "blocks_own" on public.blocks
  for all using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id);

drop policy if exists "safety_checkins_parties" on public.safety_checkins;
create policy "safety_checkins_parties" on public.safety_checkins
  for all using (
    auth.uid() = user_id
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.booker_id = auth.uid() or b.host_id = auth.uid())
    )
  )
  with check (auth.uid() = user_id);

-- Categories are public read
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories
  for select using (true);
-- >>> 3/3 auth_profile_fields
-- =============================================================================
-- Vemee — separate auth profile fields (country_code + phone_number)
-- =============================================================================

do $$ begin
  create type public.profile_gender as enum (
    'Male',
    'Female',
    'Non-binary',
    'Prefer not to say'
  );
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists last_name text,
  add column if not exists gender text,
  add column if not exists phone_number text;

-- country_code stores calling prefix e.g. +91 (not ISO-2)
alter table public.profiles
  alter column country_code drop default;

update public.profiles
set country_code = '+91'
where country_code is not null
  and country_code !~ '^\+';

alter table public.profiles
  alter column country_code set default '+91';

-- Migrate legacy combined phone into split columns when possible
update public.profiles
set
  country_code = coalesce(country_code, '+91'),
  phone_number = coalesce(
    phone_number,
    nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '')
  )
where phone is not null
  and phone_number is null;

-- Drop legacy combined profile phone (auth.users may still store full phone internally)
alter table public.profiles drop constraint if exists profiles_phone_key;
drop index if exists profiles_phone_key;
alter table public.profiles drop column if exists phone;

create unique index if not exists profiles_country_phone_unique_idx
  on public.profiles (country_code, phone_number)
  where phone_number is not null and country_code is not null;

create index if not exists profiles_email_idx on public.profiles (email);

comment on column public.profiles.country_code is 'International calling prefix, e.g. +91';
comment on column public.profiles.phone_number is 'National number digits only, no country code';

-- Trigger: minimal row on auth signup; app completes profile after OTP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    gender,
    country_code,
    phone_number,
    display_name
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'gender',
    coalesce(new.raw_user_meta_data->>'country_code', '+91'),
    new.raw_user_meta_data->>'phone_number',
    trim(
      coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' ||
      coalesce(new.raw_user_meta_data->>'last_name', '')
    )
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    gender = coalesce(excluded.gender, public.profiles.gender),
    country_code = coalesce(excluded.country_code, public.profiles.country_code),
    phone_number = coalesce(excluded.phone_number, public.profiles.phone_number),
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
    updated_at = now();
  return new;
end;
$$;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);-- >>> 4/4 admin_role
-- =============================================================================
-- Vemee — admin role on profiles + RLS helpers
-- =============================================================================

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Server-managed admin flag. Users must never update this from the client.';

create index if not exists profiles_is_admin_idx
  on public.profiles (is_admin)
  where is_admin = true;

-- Secure helper: true only when the authenticated user is an admin in DB
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
      and p.account_status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Prevent clients from elevating themselves to admin
create or replace function public.prevent_is_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.is_admin is distinct from old.is_admin
     and not public.is_admin()
  then
    raise exception 'Not allowed to change is_admin';
  end if;

  if tg_op = 'INSERT'
     and coalesce(new.is_admin, false) = true
     and not public.is_admin()
  then
    -- Allow service-role / bootstrap inserts when there is no JWT (auth.uid null)
    if auth.uid() is not null then
      raise exception 'Not allowed to set is_admin on insert';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_is_admin_escalation on public.profiles;
create trigger profiles_prevent_is_admin_escalation
  before insert or update on public.profiles
  for each row execute function public.prevent_is_admin_escalation();

-- Admins can read all profiles (for user management)
drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_admin_update_all" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

-- Optional: seed first admin by email after creating Auth user
-- update public.profiles set is_admin = true where lower(email) = lower('admin@example.com');

-- Private 3-tier ratings used only to personalize recommendations.
-- down = not for me, up = I like them, love = love this.

create table if not exists public.profile_ratings (
  id uuid primary key default gen_random_uuid(),
  rater_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.profiles (id) on delete cascade,
  tier text not null check (tier in ('down', 'up', 'love')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rater_id <> subject_id),
  unique (rater_id, subject_id)
);

create index if not exists profile_ratings_rater_idx
  on public.profile_ratings (rater_id);

alter table public.profile_ratings enable row level security;

drop policy if exists "profile_ratings_select_own" on public.profile_ratings;
create policy "profile_ratings_select_own" on public.profile_ratings
  for select using (rater_id = auth.uid() or public.is_admin());

drop policy if exists "profile_ratings_insert_own" on public.profile_ratings;
create policy "profile_ratings_insert_own" on public.profile_ratings
  for insert with check (rater_id = auth.uid() and rater_id <> subject_id);

drop policy if exists "profile_ratings_update_own" on public.profile_ratings;
create policy "profile_ratings_update_own" on public.profile_ratings
  for update using (rater_id = auth.uid())
  with check (rater_id = auth.uid() and rater_id <> subject_id);

drop policy if exists "profile_ratings_delete_own" on public.profile_ratings;
create policy "profile_ratings_delete_own" on public.profile_ratings
  for delete using (rater_id = auth.uid());

-- Membership catalog. Details live in features so they can change
-- without a new column. Every profile starts on free.

create table if not exists public.membership_plans (
  key text primary key check (key in ('free', 'pro', 'ultra_pro', 'ultra_promax')),
  name text not null,
  price_paise integer not null default 0 check (price_paise >= 0),
  currency text not null default 'INR',
  sort_order smallint not null,
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.membership_plans (key, name, price_paise, sort_order, features)
values
  (
    'free',
    'Free',
    0,
    1,
    '{"tagline":"Included with every account","highlights":["Create and join activity plans","Chat with people you connect with","People recommendations"]}'::jsonb
  ),
  (
    'pro',
    'Pro',
    19900,
    2,
    '{"tagline":"For people who host often","highlights":["Everything in Free","Create more plans each month","Pro badge on your profile"]}'::jsonb
  ),
  (
    'ultra_pro',
    'Ultra Pro',
    29900,
    3,
    '{"tagline":"More reach for your plans","highlights":["Everything in Pro","Higher placement in suggestions","Ultra Pro badge on your profile"]}'::jsonb
  ),
  (
    'ultra_promax',
    'Ultra Promax',
    49900,
    4,
    '{"tagline":"The highest membership","highlights":["Everything in Ultra Pro","Top placement for your plans","Ultra Promax badge on your profile"]}'::jsonb
  )
on conflict (key) do update
set
  name = excluded.name,
  price_paise = excluded.price_paise,
  sort_order = excluded.sort_order,
  features = excluded.features,
  updated_at = now();

alter table public.profiles
  add column if not exists membership_key text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_membership_key_fkey;

alter table public.profiles
  add constraint profiles_membership_key_fkey
  foreign key (membership_key) references public.membership_plans (key);

alter table public.membership_plans enable row level security;

drop policy if exists "membership_plans_public_read" on public.membership_plans;
create policy "membership_plans_public_read" on public.membership_plans
  for select using (true);