/**
 * Activity plan domain types for Vemee MVP.
 */

export const PLAN_CATEGORIES = [
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "fitness", label: "Fitness", icon: "🏋️" },
  { id: "outdoor", label: "Outdoor", icon: "🏏" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "movies", label: "Movies & Fun", icon: "🎬" },
  { id: "food", label: "Food & Coffee", icon: "☕" },
  { id: "study", label: "Study", icon: "📚" },
  { id: "events", label: "Events", icon: "🎟️" },
  { id: "other", label: "Other", icon: "✨" },
] as const;

export type PlanCategoryId = (typeof PLAN_CATEGORIES)[number]["id"];

export type PlanVisibility = "public" | "community";

export type PeopleNeeded = 1 | 2 | 3 | 4 | 5;

export type PlanParticipantStatus = "joined" | "interested" | "left";

export type ActivityPlan = {
  id: string;
  creatorId: string;
  category: PlanCategoryId;
  title: string;
  description: string;
  /** Placeholder key or future uploaded URL */
  imageKey: PlanCategoryId;
  imageUrl?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  locationLabel: string;
  city?: string | null;
  /** Approximate meetup coords only — never shown exactly in UI */
  lat?: number | null;
  lng?: number | null;
  peopleNeeded: PeopleNeeded;
  visibility: PlanVisibility;
  createdAt: string;
  updatedAt: string;
};

export type PlanParticipant = {
  planId: string;
  userId: string;
  status: PlanParticipantStatus;
  joinedAt: string;
};

export type CreatePlanInput = {
  creatorId: string;
  category: PlanCategoryId;
  title: string;
  description: string;
  date: string;
  time: string;
  locationLabel: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  peopleNeeded: PeopleNeeded;
  visibility: PlanVisibility;
};

export type PlanFilters = {
  category?: PlanCategoryId | "all";
  datePreset?: "all" | "today" | "tomorrow" | "weekend" | "custom";
  customDate?: string;
  distanceKm?: "all" | "nearby" | "5" | "10" | "25";
  availability?: "all" | "looking" | "almost_full" | "available";
};
