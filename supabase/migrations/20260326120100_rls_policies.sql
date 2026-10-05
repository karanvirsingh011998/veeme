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