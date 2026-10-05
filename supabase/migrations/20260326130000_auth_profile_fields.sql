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
  for insert with check (auth.uid() = id);