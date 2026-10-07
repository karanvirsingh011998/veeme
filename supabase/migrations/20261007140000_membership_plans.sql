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
