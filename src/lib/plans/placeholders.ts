import type { PlanCategoryId } from "./types";

/**
 * Activity placeholder images (Unsplash) — swap for uploads later via imageUrl.
 */
export const PLAN_PLACEHOLDERS: Record<
  PlanCategoryId,
  { url: string; label: string }
> = {
  travel: {
    url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80",
    label: "Travel",
  },
  fitness: {
    url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    label: "Fitness",
  },
  outdoor: {
    url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=80",
    label: "Outdoor",
  },
  gaming: {
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    label: "Gaming",
  },
  movies: {
    url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
    label: "Movies",
  },
  food: {
    url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    label: "Food & Coffee",
  },
  study: {
    url: "https://images.unsplash.com/photo-14565130808af0f8ea8d76d0?auto=format&fit=crop&w=900&q=80",
    label: "Study",
  },
  events: {
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
    label: "Events",
  },
  other: {
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
    label: "Plans",
  },
};

export function getPlanImage(plan: {
  category: PlanCategoryId;
  imageUrl?: string | null;
  imageKey?: PlanCategoryId;
}): string {
  if (plan.imageUrl) return plan.imageUrl;
  const key = plan.imageKey || plan.category;
  return PLAN_PLACEHOLDERS[key]?.url || PLAN_PLACEHOLDERS.other.url;
}
