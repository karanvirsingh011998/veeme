# Vemee

People-and-experiences marketplace — find your people, make better plans.

## Local development

```bash
# 1. Copy env example
cp .env.local.example .env.local

# 2. Keep development OTP (default)
# VEMEE_DEV_OTP=6666

# 3. Add Supabase URL/key when available (optional — leave blank for now)
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 4. Run
nvm use 22   # or Node 18+
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Auth modes

| State | Behavior |
|-------|----------|
| Supabase env empty | Local/dev store — OTP from `VEMEE_DEV_OTP` (default `6666`) |
| Supabase URL + anon + **service_role** | Signup inserts into `profiles`; login checks `profiles` by phone |
| `VEMEE_USE_SUPABASE_PHONE_OTP=true` | Real Supabase SMS OTP (requires Phone provider in Dashboard) |

### Required for database-backed signup/login

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # Project Settings → API → service_role
VEMEE_USE_SUPABASE_PHONE_OTP=false
VEMEE_DEV_OTP=6666
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` or the browser.

## Routes

| Route | Screen |
|-------|--------|
| `/` | Landing |
| `/signup` | Get started |
| `/login` | Log in |
| `/auth/otp` | OTP verify |
| `/dashboard` | Home |
| `/dashboard/discover` | Discover |
| `/dashboard/community` | Community |
| `/dashboard/chat` | Chat |
| `/dashboard/profile` | Profile |

## Architecture

```text
lib/auth/
  auth.ts           # UI-facing API (requestOtp, verifyOtp, getCurrentUser, signOut)
  config.ts         # isSupabaseConfigured, getDevOtp
  dev-auth.ts       # Dummy OTP path
  supabase-auth.ts  # Supabase Auth path

lib/profile/
  service.ts        # createProfile / getProfile / updateProfile

lib/supabase/
  client.ts
  server.ts
```

## Design source of truth

Visual language from the Vemee HTML prototype:

- Background `#f7f9f7`, surface white, ink `#17221e`
- Sage primary `#23604c`, soft sage `#eaf3ee`

## Admin

| Route | Access |
|-------|--------|
| `/admin/login` | Public |
| `/admin` | Admin only |
| `/admin/users` | Admin only |
| `/admin/users/[id]` | Admin only |

### Local admin login (development)

```env
VEMEE_ADMIN_EMAIL=admin@vemee.local
VEMEE_ADMIN_PASSWORD=admin123456
```

Then open `/admin/login` and sign in.

### Supabase production admin

1. Run migration `20260326140000_admin_role.sql`
2. Create an Auth user (email/password) in Supabase
3. Promote the profile:

```sql
update public.profiles
set is_admin = true
where lower(email) = lower('your-admin@example.com');
```

Admin role is enforced by middleware + `getAdminSession()` + RLS (`public.is_admin()`). Clients cannot set `is_admin` themselves.

## Docs

- [Design & product prompts](./docs/PROMPTS.md)
- [Supabase migrations & queries](./supabase/README.md)

## Stack

- Next.js App Router + TypeScript
- CSS Modules + design tokens
- Supabase-ready (optional until keys are added)
