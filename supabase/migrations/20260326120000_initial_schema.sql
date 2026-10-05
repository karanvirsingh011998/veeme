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