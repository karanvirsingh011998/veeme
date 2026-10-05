# Vemee Supabase

## Files

| Path | Purpose |
|------|---------|
| `migrations/20260326120000_initial_schema.sql` | Enums, tables, triggers, seed categories |
| `migrations/20260326120100_rls_policies.sql` | Row Level Security policies |
| `QUERIES.sql` | Copy-paste operational / discover queries |

## How to run

### Option A — Supabase CLI

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B — SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Run `migrations/20260326120000_initial_schema.sql`
3. Run `migrations/20260326120100_rls_policies.sql`
4. Use `QUERIES.sql` for smoke checks and common app queries

## Auth setup (Dashboard)

1. Authentication → Providers → enable **Phone**
2. Configure SMS provider (Twilio / MessageBird / etc.)
3. Set redirect URLs for local (`http://localhost:3000`) and production
4. Enforce 18+ via signup UI + `profiles.age_confirmed_18`

## App env vars

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Wire these into the Next.js auth forms when connecting live OTP.