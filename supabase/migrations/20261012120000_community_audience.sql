-- Link activity plans and moments to a community the author created.

alter table public.activity_plans
  add column if not exists community_id uuid references public.communities (id) on delete set null;

create index if not exists activity_plans_community_idx
  on public.activity_plans (community_id);

alter table public.moments
  add column if not exists audience text not null default 'individual';

alter table public.moments
  drop constraint if exists moments_audience_check;

alter table public.moments
  add constraint moments_audience_check
  check (audience in ('individual', 'community'));

alter table public.moments
  add column if not exists community_id uuid references public.communities (id) on delete set null;

create index if not exists moments_community_idx
  on public.moments (community_id);
