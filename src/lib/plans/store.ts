import type { ActivityPlan, PlanParticipant } from "./types";

const PLANS_KEY = "vemee_activity_plans_v1";
const PARTICIPANTS_KEY = "vemee_plan_participants_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function listStoredPlans(): ActivityPlan[] {
  return readJson<ActivityPlan[]>(PLANS_KEY, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getStoredPlan(id: string): ActivityPlan | null {
  return listStoredPlans().find((p) => p.id === id) ?? null;
}

export function upsertStoredPlan(plan: ActivityPlan): void {
  const plans = listStoredPlans().filter((p) => p.id !== plan.id);
  plans.unshift(plan);
  writeJson(PLANS_KEY, plans);
}

export function listStoredParticipants(planId?: string): PlanParticipant[] {
  const all = readJson<PlanParticipant[]>(PARTICIPANTS_KEY, []);
  return planId ? all.filter((p) => p.planId === planId) : all;
}

export function upsertStoredParticipant(row: PlanParticipant): void {
  const all = listStoredParticipants().filter(
    (p) => !(p.planId === row.planId && p.userId === row.userId),
  );
  all.push(row);
  writeJson(PARTICIPANTS_KEY, all);
}

export function removeStoredParticipant(planId: string, userId: string): void {
  const all = listStoredParticipants().filter(
    (p) => !(p.planId === planId && p.userId === userId),
  );
  writeJson(PARTICIPANTS_KEY, all);
}
