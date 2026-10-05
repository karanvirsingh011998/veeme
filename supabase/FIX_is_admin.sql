-- =============================================================================
-- FIX: add missing is_admin column (run this in Supabase SQL Editor now)
-- Error: Could not find the 'is_admin' column of 'profiles' in the schema cache
-- =============================================================================

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Server-managed admin flag. Users must never update this from the client.';

create index if not exists profiles_is_admin_idx
  on public.profiles (is_admin)
  where is_admin = true;

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

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_admin_update_all" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

-- Verify
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'is_admin';
