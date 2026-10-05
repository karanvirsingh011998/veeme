-- =============================================================================
-- Vemee — handy queries to run in the Supabase SQL editor
-- After applying migrations in supabase/migrations/
-- =============================================================================

-- 1) Confirm schema objects
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 2) Categories (seeded)
select * from public.categories order by sort_order;

-- 3) Discover active listings by category
select
  l.id,
  l.title,
  l.category,
  l.price_cents,
  l.currency,
  l.joined_count,
  l.max_participants,
  l.starts_at,
  p.display_name as host_name
from public.listings l
join public.profiles p on p.id = l.host_id
where l.status = 'active'
  and l.category = 'travel'
order by l.is_boosted desc, l.starts_at nulls last, l.created_at desc;

-- 4) Lookup profile by split phone fields (not combined storage)
select
  id,
  first_name,
  last_name,
  email,
  gender,
  country_code,
  phone_number
from public.profiles
where country_code = '+91'
  and phone_number = '9876543210';

-- 5) People you may connect with (phone-verified)
select
  p.id,
  p.first_name,
  p.last_name,
  p.display_name,
  p.country_code,
  p.phone_number,
  p.city,
  p.interests,
  p.trust_score,
  b.phone_verified,
  b.identity_verified
from public.profiles p
join public.profile_badges b on b.user_id = p.id
where p.account_status = 'active'
  and b.phone_verified = true
order by p.trust_score desc nulls last
limit 20;

-- 5) For You moments feed
select
  m.id,
  m.title,
  m.body,
  m.category,
  m.type,
  m.city,
  m.like_count,
  m.comment_count,
  p.display_name as author
from public.moments m
join public.profiles p on p.id = m.author_id
where m.is_hidden = false
order by m.created_at desc
limit 50;

-- 6) Communities directory
select
  c.id,
  c.name,
  c.slug,
  c.icon,
  c.member_count,
  c.category
from public.communities c
where c.is_public = true
order by c.member_count desc;

-- 7) Join a community (replace UUIDs)
-- insert into public.community_members (community_id, user_id)
-- values ('COMMUNITY_UUID', auth.uid());

-- 8) Create a group experience listing
-- insert into public.listings (
--   host_id, type, category, title, description, city, location_label,
--   price_cents, max_participants, icon, status, starts_at
-- ) values (
--   auth.uid(), 'group', 'travel', 'Saturday Sunrise Trek',
--   'Meet people, share the activity and make the plan together.',
--   'Gurugram', 'Gurugram', 79900, 10, '🥾', 'active',
--   timestamptz '2026-04-04 06:00:00+05:30'
-- );

-- 9) Request a booking
-- insert into public.bookings (
--   listing_id, booker_id, host_id, starts_at, ends_at,
--   duration_minutes, location_label, participants, price_cents, platform_fee_cents
-- ) values (
--   'LISTING_UUID', auth.uid(), 'HOST_UUID',
--   now() + interval '2 days',
--   now() + interval '2 days 3 hours',
--   180, 'Gurugram', 1, 79900, 7990
-- );

-- 10) Record payment (after PSP callback — prefer edge function / service role)
-- insert into public.payments (
--   booking_id, payer_id, amount_cents, method, status, provider, provider_payment_id
-- ) values (
--   'BOOKING_UUID', auth.uid(), 79900, 'upi', 'captured', 'razorpay', 'pay_xxx'
-- );

-- 11) Leave a review after completed booking
-- insert into public.reviews (booking_id, reviewer_id, reviewee_id, rating, body)
-- values ('BOOKING_UUID', auth.uid(), 'REVIEWEE_UUID', 4.8, 'Great trek partner — on time and friendly.');

-- 12) Block a user
-- insert into public.blocks (blocker_id, blocked_id)
-- values (auth.uid(), 'USER_UUID');

-- 13) Report a user / conversation
-- insert into public.reports (reporter_id, reported_user_id, reason, details)
-- values (auth.uid(), 'USER_UUID', 'harassment', 'Describe what happened…');

-- 14) Start a safety check-in for an in-person booking
-- insert into public.safety_checkins (
--   booking_id, user_id, trusted_contact_name, trusted_contact_phone, status
-- ) values (
--   'BOOKING_UUID', auth.uid(), 'Trusted Contact', '+9198XXXXXXXX', 'scheduled'
-- );

-- 15) Mark check-in started / ended
-- update public.safety_checkins
-- set status = 'started', started_at = now()
-- where id = 'CHECKIN_UUID' and user_id = auth.uid();

-- update public.safety_checkins
-- set status = 'ended', ended_at = now()
-- where id = 'CHECKIN_UUID' and user_id = auth.uid();

-- 16) Conversation inbox for current user
select
  c.id,
  c.type,
  c.title,
  c.updated_at,
  (
    select m.body
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) as last_message
from public.conversations c
join public.conversation_participants p
  on p.conversation_id = c.id
where p.user_id = auth.uid()
order by c.updated_at desc;

-- 17) Host booking dashboard
select
  b.id,
  b.status,
  b.starts_at,
  b.price_cents,
  l.title,
  booker.display_name as booker_name
from public.bookings b
join public.listings l on l.id = b.listing_id
join public.profiles booker on booker.id = b.booker_id
where b.host_id = auth.uid()
order by b.starts_at desc;

-- 18) Average rating for a profile
select
  reviewee_id,
  round(avg(rating)::numeric, 2) as avg_rating,
  count(*) as review_count
from public.reviews
where is_public = true
group by reviewee_id;

-- 19) Enable phone auth reminder (configure in Dashboard → Authentication)
-- Auth providers: Phone (OTP)
-- Optional: email magic link as secondary credential
-- Age gate: enforce age_confirmed_18 in app + profiles.age_confirmed_18 = true

-- 20) Storage buckets to create in Dashboard (or via API)
-- avatars (public read, owner write)
-- listing-covers (public read, host write)
-- moment-media (public read, author write)
-- verification-evidence (private, service role / owner read)