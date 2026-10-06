-- Legal acceptance timestamps captured at signup.
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_accepted_at timestamptz;

comment on column public.profiles.terms_accepted_at is
  'When the user accepted Terms & Conditions during signup.';
comment on column public.profiles.privacy_accepted_at is
  'When the user accepted the Privacy Policy during signup.';
