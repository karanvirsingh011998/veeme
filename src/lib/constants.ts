/**
 * Shared marketing and product content for the Vemee landing experience.
 */

export const NAV_LINKS = [
  { href: "#discover", label: "Discover" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#safety", label: "Safety" },
  { href: "#communities", label: "Communities" },
] as const;

export const CATEGORIES = [
  { icon: "✈️", label: "Travel" },
  { icon: "🏋️", label: "Workout" },
  { icon: "☕", label: "Food" },
  { icon: "🎟️", label: "Events" },
  { icon: "🎮", label: "Gaming" },
  { icon: "📚", label: "Study" },
  { icon: "👥", label: "Communities" },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Discover",
    description:
      "Find people, experiences and communities for whatever you have in mind.",
    icon: "⌕",
  },
  {
    step: "02",
    title: "Connect",
    description: "Chat and understand the context before booking.",
    icon: "💬",
  },
  {
    step: "03",
    title: "Book",
    description: "Choose time, duration, location and payment.",
    icon: "📅",
  },
  {
    step: "04",
    title: "Experience",
    description: "Meet, enjoy and review — then return for the next plan.",
    icon: "✨",
  },
] as const;

export const PEOPLE = [
  {
    name: "Priya",
    role: "Travel Buddy",
    avatar: "👩",
    rating: "4.8",
    interest: "Weekend getaways & cafe hops",
    verified: true,
  },
  {
    name: "Rahul",
    role: "Workout Partner",
    avatar: "🧔",
    rating: "4.9",
    interest: "Sunrise runs & strength days",
    verified: true,
  },
  {
    name: "Sneha",
    role: "Event Companion",
    avatar: "👩‍🦰",
    rating: "4.8",
    interest: "Concerts, movies & local events",
    verified: true,
  },
  {
    name: "Aarav",
    role: "Fitness Partner",
    avatar: "🧑",
    rating: "4.7",
    interest: "Cycling rides & badminton",
    verified: true,
  },
] as const;

export const TRUST_ITEMS = [
  "Phone verified",
  "Identity verification",
  "Transparent badges",
  "Block & report",
  "Safety check-ins",
  "Refund/cancellation clarity",
] as const;

export const COMMUNITIES = [
  { icon: "🥾", name: "Delhi Trekkers", members: "12K members" },
  { icon: "🏋️", name: "Fitness Buddies", members: "18K members" },
  { icon: "🍜", name: "Food Explorers", members: "15K members" },
  { icon: "🎮", name: "Gaming Squad", members: "9K members" },
  { icon: "🏍️", name: "Weekend Riders", members: "22K members" },
  { icon: "📚", name: "Study Circle", members: "7K members" },
] as const;