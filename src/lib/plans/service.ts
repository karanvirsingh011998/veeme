import { isSupabaseConfigured } from "@/lib/auth/config";
import { PLAN_CATEGORIES } from "./types";
import type {
  ActivityPlan,
  CreatePlanInput,
  PlanFilters,
  PlanParticipant,
} from "./types";
import {
  getStoredPlan,
  listStoredParticipants,
  listStoredPlans,
  removeStoredParticipant,
  upsertStoredParticipant,
  upsertStoredPlan,
} from "./store";
import { getPlanImage } from "./placeholders";
import {
  distanceKm,
  formatApproxDistance,
  type ApproxLocation,
} from "@/lib/location/geo";

function useRemotePlans() {
  return typeof window !== "undefined" && isSupabaseConfigured();
}

async function fetchRemotePlans(): Promise<{
  plans: ActivityPlan[];
  participants: PlanParticipant[];
}> {
  const res = await fetch("/api/plans");
  if (!res.ok) return { plans: [], participants: [] };
  return (await res.json()) as {
    plans: ActivityPlan[];
    participants: PlanParticipant[];
  };
}

export type PlanWithMeta = ActivityPlan & {
  image: string;
  categoryLabel: string;
  categoryIcon: string;
  joinedCount: number;
  spotsLeft: number;
  distanceLabel?: string | null;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorRating?: number | null;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function categoryMeta(id: ActivityPlan["category"]) {
  const found = PLAN_CATEGORIES.find((c) => c.id === id);
  return {
    categoryLabel: found?.label || "Other",
    categoryIcon: found?.icon || "✨",
  };
}

/**
 * Creates a public/community plan and auto-joins the creator.
 */
export async function createPlan(
  input: CreatePlanInput,
): Promise<{ ok: true; plan: ActivityPlan } | { ok: false; error: string }> {
  const title = input.title.trim();
  const description = input.description.trim();
  const locationLabel = input.locationLabel.trim();

  if (!title) return { ok: false, error: "Add a plan title." };
  if (!description) return { ok: false, error: "Add a short description." };
  if (!input.date) return { ok: false, error: "Pick a date." };
  if (!input.time) return { ok: false, error: "Pick a time." };
  if (!locationLabel) return { ok: false, error: "Add a meetup location." };

  if (useRemotePlans()) {
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        title,
        description,
        locationLabel,
      }),
    });
    const data = (await res.json()) as { plan?: ActivityPlan; error?: string };
    if (!res.ok || !data.plan) {
      return { ok: false, error: data.error || "Could not create plan." };
    }
    return { ok: true, plan: data.plan };
  }

  const now = new Date().toISOString();
  const plan: ActivityPlan = {
    id: newId(),
    creatorId: input.creatorId,
    category: input.category,
    title,
    description,
    imageKey: input.category,
    imageUrl: null,
    date: input.date,
    time: input.time,
    locationLabel,
    city: input.city || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    peopleNeeded: input.peopleNeeded,
    visibility: input.visibility,
    createdAt: now,
    updatedAt: now,
  };

  upsertStoredPlan(plan);
  upsertStoredParticipant({
    planId: plan.id,
    userId: input.creatorId,
    status: "joined",
    joinedAt: now,
  });

  return { ok: true, plan };
}

function enrich(
  plan: ActivityPlan,
  userLocation?: ApproxLocation | null,
  creators?: Map<string, { name: string; avatar?: string | null; rating?: number | null }>,
  allParticipants?: PlanParticipant[],
): PlanWithMeta {
  const participants = (
    allParticipants || listStoredParticipants(plan.id)
  ).filter((p) => p.planId === plan.id && p.status === "joined");
  const joinedCount = participants.length;
  const meta = categoryMeta(plan.category);
  const creator = creators?.get(plan.creatorId);

  let distanceLabel: string | null = null;
  if (
    userLocation?.lat != null &&
    userLocation?.lng != null &&
    plan.lat != null &&
    plan.lng != null
  ) {
    distanceLabel = formatApproxDistance(
      distanceKm(userLocation.lat, userLocation.lng, plan.lat, plan.lng),
    );
  }

  return {
    ...plan,
    image: getPlanImage(plan),
    ...meta,
    joinedCount,
    spotsLeft: Math.max(plan.peopleNeeded + 1 - joinedCount, 0),
    distanceLabel,
    creatorName: creator?.name,
    creatorAvatar: creator?.avatar,
    creatorRating: creator?.rating ?? null,
  };
}

/**
 * Lists discoverable plans with optional filters.
 */
export async function listPlans(
  filters: PlanFilters = {},
  opts?: {
    userLocation?: ApproxLocation | null;
    creators?: Map<
      string,
      { name: string; avatar?: string | null; rating?: number | null }
    >;
  },
): Promise<PlanWithMeta[]> {
  let remoteParticipants: PlanParticipant[] | undefined;
  let plans: ActivityPlan[];

  if (useRemotePlans()) {
    const remote = await fetchRemotePlans();
    plans = remote.plans;
    remoteParticipants = remote.participants;
  } else {
    plans = listStoredPlans();
  }

  plans = plans.filter(
    (p) => p.visibility === "public" || p.visibility === "community",
  );

  if (filters.category && filters.category !== "all") {
    plans = plans.filter((p) => p.category === filters.category);
  }

  const today = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  if (filters.datePreset === "today") {
    const t = ymd(today);
    plans = plans.filter((p) => p.date === t);
  } else if (filters.datePreset === "tomorrow") {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    plans = plans.filter((p) => p.date === ymd(t));
  } else if (filters.datePreset === "weekend") {
    plans = plans.filter((p) => {
      const day = new Date(`${p.date}T12:00:00`).getDay();
      return day === 0 || day === 6;
    });
  } else if (filters.datePreset === "custom" && filters.customDate) {
    plans = plans.filter((p) => p.date === filters.customDate);
  }

  let enriched = plans.map((p) =>
    enrich(p, opts?.userLocation, opts?.creators, remoteParticipants),
  );

  if (filters.availability === "looking") {
    enriched = enriched.filter((p) => p.spotsLeft >= 2);
  } else if (filters.availability === "almost_full") {
    enriched = enriched.filter((p) => p.spotsLeft === 1);
  } else if (filters.availability === "available") {
    enriched = enriched.filter((p) => p.spotsLeft > 0);
  }

  if (opts?.userLocation?.lat != null && filters.distanceKm && filters.distanceKm !== "all") {
    const max =
      filters.distanceKm === "nearby"
        ? 3
        : Number(filters.distanceKm);
    enriched = enriched.filter((p) => {
      if (p.lat == null || p.lng == null) return filters.distanceKm === "all";
      const km = distanceKm(
        opts.userLocation!.lat!,
        opts.userLocation!.lng!,
        p.lat,
        p.lng,
      );
      return km <= max;
    });
  }

  return enriched;
}

export async function getPlan(
  id: string,
  opts?: {
    userLocation?: ApproxLocation | null;
    creators?: Map<
      string,
      { name: string; avatar?: string | null; rating?: number | null }
    >;
  },
): Promise<PlanWithMeta | null> {
  if (useRemotePlans()) {
    const res = await fetch(`/api/plans/${id}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      plan: ActivityPlan;
      participants: PlanParticipant[];
    };
    return enrich(
      data.plan,
      opts?.userLocation,
      opts?.creators,
      data.participants,
    );
  }
  const plan = getStoredPlan(id);
  if (!plan) return null;
  return enrich(plan, opts?.userLocation, opts?.creators);
}

export async function joinPlan(
  planId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (useRemotePlans()) {
    const res = await fetch(`/api/plans/${planId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Could not join." };
    return { ok: true };
  }

  const plan = getStoredPlan(planId);
  if (!plan) return { ok: false, error: "Plan not found." };
  if (plan.creatorId === userId) {
    return { ok: false, error: "You’re the plan creator — you’re already in." };
  }

  const joined = listStoredParticipants(planId).filter((p) => p.status === "joined");
  if (joined.some((p) => p.userId === userId)) {
    return { ok: true };
  }
  if (joined.length >= plan.peopleNeeded + 1) {
    return { ok: false, error: "This plan is full." };
  }

  upsertStoredParticipant({
    planId,
    userId,
    status: "joined",
    joinedAt: new Date().toISOString(),
  });
  return { ok: true };
}

export async function leavePlan(planId: string, userId: string): Promise<void> {
  removeStoredParticipant(planId, userId);
}

export function getParticipant(
  planId: string,
  userId: string,
): PlanParticipant | null {
  return (
    listStoredParticipants(planId).find((p) => p.userId === userId) ?? null
  );
}

/** Async participant lookup (remote-aware). */
export async function getParticipantAsync(
  planId: string,
  userId: string,
): Promise<PlanParticipant | null> {
  if (useRemotePlans()) {
    const res = await fetch(`/api/plans/${planId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { participants: PlanParticipant[] };
    return data.participants.find((p) => p.userId === userId) ?? null;
  }
  return getParticipant(planId, userId);
}

export function listUserPlans(userId: string): {
  created: ActivityPlan[];
  joined: ActivityPlan[];
} {
  const all = listStoredPlans();
  const created = all.filter((p) => p.creatorId === userId);
  const joinedIds = new Set(
    listStoredParticipants()
      .filter((p) => p.userId === userId && p.status === "joined")
      .map((p) => p.planId),
  );
  const joined = all.filter(
    (p) => joinedIds.has(p.id) && p.creatorId !== userId,
  );
  return { created, joined };
}

export async function listUserPlansAsync(userId: string): Promise<{
  created: ActivityPlan[];
  joined: ActivityPlan[];
}> {
  if (useRemotePlans()) {
    const remote = await fetchRemotePlans();
    const created = remote.plans.filter((p) => p.creatorId === userId);
    const joinedIds = new Set(
      remote.participants
        .filter((p) => p.userId === userId && p.status === "joined")
        .map((p) => p.planId),
    );
    const joined = remote.plans.filter(
      (p) => joinedIds.has(p.id) && p.creatorId !== userId,
    );
    return { created, joined };
  }
  return listUserPlans(userId);
}

export function formatPlanWhen(date: string, time: string): string {
  try {
    const d = new Date(`${date}T${time}:00`);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return `${date} · ${time}`;
  }
}

/** Relative “posted” time for plan cards. */
export function formatPostedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export type PlanMember = {
  userId: string;
  name: string;
  isCreator: boolean;
  joinedAt: string;
};

/**
 * Lists joined members for a plan (creator + joiners).
 */
export async function listPlanMembers(planId: string): Promise<PlanMember[]> {
  let plan: ActivityPlan | null = null;
  let participants: PlanParticipant[] = [];

  if (useRemotePlans()) {
    const res = await fetch(`/api/plans/${planId}`);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      plan: ActivityPlan;
      participants: PlanParticipant[];
    };
    plan = data.plan;
    participants = data.participants.filter((p) => p.status === "joined");
  } else {
    plan = getStoredPlan(planId);
    participants = listStoredParticipants(planId).filter(
      (p) => p.status === "joined",
    );
  }

  if (!plan) return [];

  const { buildCreatorMapAsync } = await import("@/lib/people/service");
  const map = await buildCreatorMapAsync([
    plan.creatorId,
    ...participants.map((p) => p.userId),
  ]);

  const members: PlanMember[] = participants.map((p) => ({
    userId: p.userId,
    name: map.get(p.userId)?.name || "Member",
    isCreator: p.userId === plan!.creatorId,
    joinedAt: p.joinedAt,
  }));

  // Ensure creator is listed even if participant row is missing.
  if (!members.some((m) => m.userId === plan!.creatorId)) {
    members.unshift({
      userId: plan.creatorId,
      name: map.get(plan.creatorId)?.name || "Plan creator",
      isCreator: true,
      joinedAt: plan.createdAt,
    });
  }

  return members.sort((a, b) => {
    if (a.isCreator) return -1;
    if (b.isCreator) return 1;
    return a.joinedAt.localeCompare(b.joinedAt);
  });
}
