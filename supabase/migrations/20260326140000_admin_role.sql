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