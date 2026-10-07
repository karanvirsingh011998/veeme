# Vemee Supabase

## Files

| Path | Purpose |
|------|---------|
| `migrations/20260326120000_initial_schema.sql` | Enums, tables, triggers, seed categories |
| `migrations/20260326120100_rls_policies.sql` | Row Level Security policies |
| `migrations/20260326160000_activity_plans.sql` | Plans, participants, connections, approx location |
| `migrations/20260326170000_legal_acceptance.sql` | Terms / Privacy acceptance timestamps on profiles |
| `migrations/20260326180000_query_indexes.sql` | Indexes for plan, connection, and chat lookups |
| `QUERIES.sql` | Copy-paste operational / discover queries |

## Plans + chat data

After running `20260326160000_activity_plans.sql` in the SQL Editor **and** setting `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` / Vercel:

- **Create / Explore plans** → `activity_plans` + `plan_participants` via `/api/plans`
- **1:1 chat** → existing `conversations` / `messages` via `/api/chat/*`

Without the service role key (or without Supabase URL), the app falls back to browser local storage.

## Auth modes

Without `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the app uses development OTP from `VEMEE_DEV_OTP` (default `6666`). Profiles persist in browser local storage via `lib/profile/service.ts`.

When keys are set, the same auth/profile APIs switch to Supabase Auth + `public.profiles`.

## How to run

### Option A — Supabase CLI

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B — SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Run migrations in order under `migrations/`
3. Use `QUERIES.sql` for smoke checks

## Auth setup (Dashboard)

1. Authentication → Providers → enable **Phone**
2. Configure SMS provider
3. Set redirect URLs for local (`http://localhost:3000`) and production

## App env vars

Copy from `.env.local.example`:

```env
VEMEE_DEV_OTP=6666
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.