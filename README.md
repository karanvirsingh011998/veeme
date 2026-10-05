# Vemee

People-and-experiences marketplace — find your people, make better plans.

This repo contains:

- Public **landing page** with intentional mobile + desktop layouts
- Phone-first **auth UI** (login, signup, OTP)
- Shared **design tokens** from the Vemee prototype HTML
- `docs/PROMPTS.md` — all design/product prompts
- `supabase/` — migrations and queries for the MVP data model

## Design source of truth

Visual language comes from `Vemee_V3_Endless_ForYou.html`:

- Background `#f7f9f7`, surface white, ink `#17221e`
- Sage primary `#23604c`, soft sage `#eaf3ee`
- Soft borders, large card radii, restrained shadows

## Develop

```bash
nvm use 22   # or Node 18+
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Screen |
|-------|--------|
| `/` | Landing |
| `/signup` | Get started |
| `/login` | Log in |
| `/auth/otp` | OTP verify |

## Docs

- [Design & product prompts](./docs/PROMPTS.md)
- [Supabase migrations & queries](./supabase/README.md)

## Stack

- Next.js App Router + TypeScript
- CSS Modules + design tokens
- Supabase (schema ready; auth wiring next)# veeme
