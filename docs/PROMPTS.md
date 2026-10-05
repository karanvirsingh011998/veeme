# Vemee — Design & Product Prompts

This file collects the design, product, and implementation prompts used to build the Vemee web + mobile landing experience. Treat the attached prototype HTML (`Vemee_V3_Endless_ForYou.html`) as the single visual source of truth.

---

## Master prompt — Web + mobile design requirement

```text
# VEMEE — WEB + MOBILE DESIGN REQUIREMENT

The landing page must be designed independently for desktop/web and mobile,
while maintaining one consistent Vemee design system.

Do NOT simply make the mobile layout wider on desktop.
Both experiences must feel intentionally designed.
```

---

## 1. Responsive design principle

```text
The design must support:

Mobile: 320, 360, 375, 390, 414, 430
Tablet: 768, 820, 1024
Desktop: 1280, 1440, 1600, 1920

No layout should break between these sizes.
No horizontal scrolling.
No overlapping elements.
No clipped text.
No awkward empty areas.
```

---

## 2. Mobile design

```text
Mobile is a primary product experience, not a reduced desktop version.

Use the attached HTML as the strongest reference for mobile styling.

Preserve:
- Full-width mobile surfaces
- Compact headers
- Rounded cards
- Soft borders
- Sage-green primary actions
- Small but clear typography
- Thumb-friendly interactions
- Vertical scrolling
- Minimal visual noise

For the public landing page, DO NOT use the logged-in application's bottom navigation.

Instead use:
Vemee                         ☰
and a prominent Get started CTA.
```

---

## 3. Mobile landing page structure

```text
Header
Hero
Hero visual
Primary CTA
Categories
How Vemee works
People preview
Safety / Trust
Communities
Final CTA
Footer

First viewport must communicate:
Vemee
Find your people. Make better plans.
Get started
```

---

## 4. Mobile hero

```text
Vemee

Find your people.
Make better plans.

Discover people, experiences and
communities for whatever you have
in mind.

[ Get started ]

Explore Vemee

Then show the product visual.

Headline ~40–48px on larger phones, ~34–38px on smaller phones.
Avoid pushing the CTA below the fold.
```

---

## 5. Mobile product visual

```text
Use a phone/app mockup or carefully composed UI cards reflecting the prototype:

People you may connect with
Priya / Travel Buddy / ★ 4.8 / ✓ Verified
Rahul / Workout Partner / ★ 4.9 / ✓ Verified

Saturday Sunrise Trek
🥾
6/10 joined
₹799 / person

Do not use generic SaaS illustrations.
```

---

## 6. Mobile category grid

```text
Use a 2-column grid rather than six tiny columns.
White surface, light border, large radius, subtle shadow, dark text, sage accent.
```

---

## 7. Mobile how-it-works

```text
Vertical cards:
01 Discover
02 Connect
03 Book
04 Experience

Do not force a four-column desktop layout onto mobile.
```

---

## 8. Mobile people cards

```text
Horizontal scrolling carousel.
Show ~2.2 cards in the viewport so users understand the row is scrollable.
```

---

## 9. Mobile safety section

```text
Soft sage background.
Heading: Built for real-world connections.
Trust items: Phone verified, Identity verification, Block & report,
Safety check-ins, Transparent policies.
Do not claim "100% safe".
```

---

## 10. Mobile auth

```text
viewport width → comfortable card → large input → large CTA
Inputs/buttons ≥ ~48px high.
OTP boxes large enough for easy tapping.
```

---

## 11. Desktop landing page

```text
Centered max-width container: 1200px–1280px
Header: Vemee | Discover How it works Safety Communities | Log in [Get started]
Light header. No huge/dark navbar.
```

---

## 12. Desktop hero

```text
Two-column layout.
Left: headline, supporting copy, Get started + Explore Vemee
Right: polished Vemee product visualization
```

---

## 13. Desktop hero visual

```text
Layered product cards:
Main: For You / People you may connect with
Floating: Saturday Sunrise Trek, Workout nearby, Coffee & conversations
Subtle depth. Avoid excessive floating animations.
```

---

## 14. Desktop category section

```text
4-column or 7-column responsive grid.
At 1280px: Travel | Workout | Food | Events | Gaming | Study | Communities
Enough whitespace. Not overly tall.
```

---

## 15. Desktop how-it-works

```text
Horizontal four-step layout with subtle connecting line:
01 Discover → 02 Connect → 03 Book → 04 Experience
```

---

## 16. Desktop people section

```text
Wide horizontal card layout with avatar, name, category, verification,
rating, short interest, and View profile CTA.
```

---

## 17. Desktop safety section

```text
Two-column composition.
Left: Real people. Clear signals. Better plans.
Right: trust feature list on soft sage surfaces.
```

---

## 18. Desktop community section

```text
Split layout.
Left: Find communities that feel like you. + Explore communities CTA
Right: grid of community cards matching prototype language.
```

---

## 19. Desktop final CTA

```text
Soft sage background.
Your next plan starts with the right person.
Get started + Log in
Large rounded container. No huge gradient.
```

---

## 20. Design tokens

```css
:root {
  --vemee-bg: #f7f9f7;
  --vemee-surface: #ffffff;
  --vemee-ink: #17221e;
  --vemee-muted: #78827e;
  --vemee-line: #e5eae7;
  --vemee-green: #23604c;
  --vemee-green-2: #2d6d58;
  --vemee-green-soft: #eaf3ee;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;

  --shadow-card: 0 3px 14px rgba(25,42,35,.055);
}
```

---

## 21. Typography

```text
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

Desktop: Hero 64–76px · Section 40–48px · Body 17–19px · Labels 13–15px
Mobile: Hero 36–48px · Section 28–34px · Body 15–17px · Labels 12–14px
Use clamp() where appropriate.
```

---

## 22. Spacing

```text
Scale: 4 8 12 16 20 24 32 40 48 64 80 96 120
Desktop sections: 80–120px vertical
Mobile sections: 48–72px vertical
```

---

## 23. Cards

```css
background: white;
border: 1px solid #e5eae7;
border-radius: 18px;
box-shadow: 0 3px 14px rgba(25,42,35,.055);
```

---

## 24. Buttons

```text
Primary: deep sage green, white text, rounded
Secondary: white, green text, light border
Hover: slight elevation + subtle background shift
Pressed: slight scale-down, fast transition
```

---

## 25. Navbar behavior

```text
Desktop: sticky/fixed with subtle backdrop after scroll
Mobile hamburger: Discover, How it works, Safety, Communities, Log in, Get started
Smooth menu animation
```

---

## 26. Breakpoint strategy

```text
<640px
640–767px
768–1023px
1024–1279px
1280px+
```

---

## 27. Manual test matrix

```text
iPhone-like: 375×812, 390×844, 430×932
Tablet: 768×1024, 1024×1366
Desktop: 1280×800, 1440×900, 1920×1080

Check header, hero, CTA, typography, cards, horizontal scrolling,
section spacing, footer, login, signup, OTP.
```

---

## 28. Mobile performance

```text
Prefer SVG/CSS/optimized images/Next Image/lazy loading.
Lightweight animations.
Respect prefers-reduced-motion.
```

---

## 29. Visual acceptance test

```text
If someone sees the landing page without the product name, they should still
recognize it belongs to the same product as the Vemee HTML prototype.

Landing page → same design system → Vemee application
NOT generic SaaS landing → completely different app
```

---

## 30. Final quality bar

```text
Designed, balanced, premium, human, trustworthy, fast, modern,
mobile-native, desktop-native.
Every section intentional. Every CTA purposeful. Every breakpoint considered.
Auth screens must feel like part of Vemee.
```

---

## Product specification prompt (from Vemee Product UI Feature Spec)

```text
Vemee is a people-and-experiences marketplace designed to help users discover,
connect with and book people for a specific purpose: companionship, workouts,
travel, events, gaming, food, study and interest-based communities.

Core idea: Find the right person for the moment — then make the interaction
safe, simple and repeatable.

Pillars: Discover → Connect → Book → Experience → Belong

Primary destinations (app): Home, Discover, Community, Chat, Profile
Public landing must NOT use bottom navigation.

MVP must-haves: OTP/login, profile + listing, verification, discover + filters,
chat, booking, payment/refund, ratings/reviews, report/block, safety check-in.

Trust principle: Verification increases trust, not a false promise of safety.
```

---

## Implementation prompts used in this repo

### Scaffold

```text
Create a Next.js (App Router) TypeScript project for Vemee with a modular
directory structure. Centralize design tokens from the prototype HTML.
Build the public landing page and phone-first auth screens (login, signup, OTP).
```

### Landing composition

```text
Implement intentional mobile and desktop layouts for:
Header, Hero + product visual, Categories, How it works, People preview,
Safety/Trust, Communities, Final CTA, Footer.
Use CSS modules + design tokens. No bottom nav on marketing pages.
```

### Auth

```text
Build phone OTP auth UI with comfortable card, ≥48px inputs/buttons,
large OTP boxes, and 18+ age gate on signup. Wire navigation between
/login, /signup, and /auth/otp. Keep UI-ready for Supabase Auth.
```

### Docs & database

```text
Create docs/PROMPTS.md with all design/product prompts.
Create supabase/migrations with SQL for profiles, verification, listings,
bookings, chat, communities, moments, reviews, reports, and safety check-ins
aligned to the MVP feature specification.
```

---

## Source files referenced

| File | Role |
|------|------|
| `Vemee_V3_Endless_ForYou.html` | Visual source of truth (tokens, cards, people, groups, communities) |
| `Vemee_Product_UI_Feature_Specification.docx` | Product pillars, MVP scope, trust/safety, monetization, roadmap |