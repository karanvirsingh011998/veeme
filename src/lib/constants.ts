/**
 * Shared marketing and product content for the Vemee landing experience.
 */

export const NAV_LINKS = [
  { href: "#discover", label: "Explore" },
  { href: "#activities", label: "Activities" },
  { href: "#communities", label: "Communities" },
  { href: "#about", label: "About" },
  { href: "#safety", label: "Safety" },
  { href: "#contact", label: "Contact" },
] as const;

/** Compact primary nav for the sticky header. */
export const HEADER_NAV_LINKS = [
  { href: "#discover", label: "Explore" },
  { href: "#about", label: "About" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#safety", label: "Safety" },
] as const;

export const FOOTER_LEGAL = [
  { href: "#privacy", label: "Privacy Policy" },
  { href: "#terms", label: "Terms of Service" },
  { href: "#guidelines", label: "Community Guidelines" },
] as const;

/** Use-case chips shown under the hero (not in the first viewport composition). */
export const HERO_USE_CASES = [
  { icon: "🏋️", label: "Find a gym/workout partner" },
  { icon: "🏏", label: "Join a weekend outdoor game" },
  { icon: "🎮", label: "Find your PUBG/BGMI squad" },
  { icon: "✈️", label: "Find travel companions" },
  { icon: "🎬", label: "Find someone for a movie" },
  { icon: "☕", label: "Grab coffee or have a chat" },
  { icon: "📚", label: "Find study partners" },
  { icon: "🎟️", label: "Discover events and experiences" },
] as const;

export const CATEGORIES = [
  {
    icon: "✈️",
    label: "Travel",
    description: "Find travel companions for your next trip.",
  },
  {
    icon: "🏋️",
    label: "Fitness",
    description: "Find workout partners, running buddies or gym partners.",
  },
  {
    icon: "🏏",
    label: "Outdoor",
    description:
      "Find people for cricket, football, badminton, trekking and more.",
  },
  {
    icon: "🎮",
    label: "Gaming",
    description:
      "Need one more for your squad? Find players who are ready to play.",
  },
  {
    icon: "🎬",
    label: "Movies & Fun",
    description: "Movie plans, coffee, food or a casual hangout.",
  },
  {
    icon: "📚",
    label: "Study",
    description: "Find study partners, learning groups and communities.",
  },
  {
    icon: "🎟️",
    label: "Events",
    description: "Discover experiences and join people going there.",
  },
  {
    icon: "👥",
    label: "Communities",
    description: "Join communities around your interests.",
  },
] as const;

export const PLAN_EXAMPLES = [
  {
    plan: "I want to play cricket this weekend.",
    outcome: "Find people nearby who want to play.",
    accent: "outdoor",
  },
  {
    plan: "I need a PUBG squad tonight.",
    outcome: "Find players looking for teammates.",
    accent: "gaming",
  },
  {
    plan: "I want to go trekking on Saturday.",
    outcome: "Discover a trek and people joining it.",
    accent: "travel",
  },
  {
    plan: "I want someone to go for a movie.",
    outcome: "Find people interested in the same movie.",
    accent: "fun",
  },
  {
    plan: "I want a study partner.",
    outcome: "Join a study community.",
    accent: "study",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose what you want to do",
    description: "Pick an activity, plan or interest.",
    icon: "01",
  },
  {
    step: "02",
    title: "Find your people",
    description:
      "Discover people and communities looking for the same thing.",
    icon: "02",
  },
  {
    step: "03",
    title: "Connect",
    description: "Chat, join a group or respond to a plan.",
    icon: "03",
  },
  {
    step: "04",
    title: "Do more together",
    description:
      "Meet, play, travel, study, explore and create experiences together.",
    icon: "04",
  },
] as const;

export const TRUST_FEATURES = [
  {
    icon: "✓",
    title: "Verified people",
    description: "Know who you’re connecting with.",
  },
  {
    icon: "★",
    title: "Ratings & reputation",
    description: "Build trust through genuine experiences.",
  },
  {
    icon: "◈",
    title: "Community-first",
    description: "Join activity-based groups and communities.",
  },
  {
    icon: "◎",
    title: "Safety-focused",
    description:
      "Controls designed to make meeting and interacting with people more comfortable.",
  },
] as const;

export const LIFESTYLE_TILES = [
  { label: "Travel", tone: "a" },
  { label: "Fitness", tone: "b" },
  { label: "Gaming", tone: "c" },
  { label: "Food", tone: "d" },
  { label: "Movies", tone: "a" },
  { label: "Study", tone: "b" },
  { label: "Sports", tone: "c" },
  { label: "Events", tone: "d" },
  { label: "Communities", tone: "a" },
] as const;
