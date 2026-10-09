/**
 * Shared marketing content for the Veeme Refined landing experience.
 */

export const HEADER_NAV_LINKS = [
  { href: "/#nearby", label: "Plans" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#safety", label: "Safety" },
  { href: "/membership", label: "Membership" },
  { href: "/about", label: "About" },
] as const;

export const NAV_LINKS = HEADER_NAV_LINKS;

export const FOOTER_LINKS = [
  { href: "/#nearby", label: "Plans" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#safety", label: "Safety" },
  { href: "/membership", label: "Membership" },
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
] as const;

export const LIVE_PLANS = [
  {
    category: "Sports",
    title: "Morning badminton",
    meta: "7:00 AM • 4 spots",
  },
  {
    category: "Coffee",
    title: "Cafe catch-up",
    meta: "Today, 5:30 • 2 spots",
  },
  {
    category: "Study",
    title: "Library deep work",
    meta: "Tomorrow, 10:00 • 3 spots",
  },
  {
    category: "Travel",
    title: "Weekend day trip",
    meta: "Sat, 7:00 AM • 5 spots",
  },
  {
    category: "Events",
    title: "Indie film night",
    meta: "Tonight, 8:15 • 6 spots",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "1",
    description:
      "Pick a plan that fits your mood — sports, coffee, study, travel, or events.",
  },
  {
    step: "2",
    description:
      "Tap in. You’re joining a plan, not a profile — no small talk needed.",
  },
  {
    step: "3",
    description:
      "Show up, do the thing together, and see who you click with.",
  },
] as const;

export const TRUST_FEATURES = [
  {
    id: "verified",
    title: "Verified people",
    description: "Phone-checked members so you’re meeting real neighbors.",
  },
  {
    id: "ratings",
    title: "Community ratings",
    description: "See how others experienced a plan before you join.",
  },
  {
    id: "safety",
    title: "Safety controls",
    description: "Report, block, and stay in control of who you meet.",
  },
] as const;
