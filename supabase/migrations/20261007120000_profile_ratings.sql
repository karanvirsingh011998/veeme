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

create policy "profile_ratings_select_own" on public.profile_ratings
  for select using (rater_id = auth.uid() or public.is_admin());

create policy "profile_ratings_insert_own" on public.profile_ratings
  for insert with check (rater_id = auth.uid() and rater_id <> subject_id);

create policy "profile_ratings_update_own" on public.profile_ratings
  for update using (rater_id = auth.uid())
  with check (rater_id = auth.uid() and rater_id <> subject_id);

create policy "profile_ratings_delete_own" on public.profile_ratings
  for delete using (rater_id = auth.uid());
