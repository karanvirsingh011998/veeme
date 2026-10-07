import { getDataClient } from "@/lib/supabase/data";
import type {
  ActivityPlan,
  CreatePlanInput,
  PlanParticipant,
} from "@/lib/plans/types";

type DbPlan = {
  id: string;
  creator_id: string;
  category: string;
  title: string;
  description: string;
  image_key: string;
  image_url: string | null;
  plan_date: string;
  plan_time: string;
  location_label: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  people_needed: number;
  visibility: "public" | "community";
  created_at: string;
  updated_at: string;
};

const PLAN_COLUMNS =
  "id, creator_id, category, title, description, image_key, image_url, plan_date, plan_time, location_label, city, lat, lng, people_needed, visibility, created_at, updated_at";

const PARTICIPANT_COLUMNS = "plan_id, user_id, status, joined_at";

function mapPlan(row: DbPlan): ActivityPlan {
  return {
    id: row.id,
    creatorId: row.creator_id,
    category: row.category as ActivityPlan["category"],
    title: row.title,
    description: row.description,
    imageKey: row.image_key as ActivityPlan["imageKey"],
    imageUrl: row.image_url,
    date: row.plan_date,
    time: String(row.plan_time).slice(0, 5),
    locationLabel: row.location_label,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    peopleNeeded: row.people_needed as ActivityPlan["peopleNeeded"],
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Server: create plan + auto-join creator in Supabase.
 */
export async function sbCreatePlan(
  input: CreatePlanInput,
): Promise<{ ok: true; plan: ActivityPlan } | { ok: false; error: string }> {
  const db = getDataClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const { data, error } = await db
    .from("activity_plans")
    .insert({
      creator_id: input.creatorId,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      image_key: input.category,
      image_url: null,
      plan_date: input.date,
      plan_time: input.time,
      location_label: input.locationLabel.trim(),
      city: input.city ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      people_needed: input.peopleNeeded,
      visibility: input.visibility,
    })
    .select(PLAN_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Could not create plan." };
  }

  const plan = mapPlan(data as DbPlan);
  await db.from("plan_participants").insert({
    plan_id: plan.id,
    user_id: input.creatorId,
    status: "joined",
  });

  return { ok: true, plan };
}

export type PlanListQuery = {
  limit?: number;
  offset?: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function sbListPlans(
  query: PlanListQuery = {},
): Promise<{ plans: ActivityPlan[]; hasMore: boolean }> {
  const db = getDataClient();
  if (!db) return { plans: [], hasMore: false };

  const limit = Math.min(Math.max(query.limit ?? 20, 1), 40);
  const offset = Math.max(query.offset ?? 0, 0);
  // Client filter types drop methods after reassignment; keep the chain loosely typed.
  let request = db
    .from("activity_plans")
    .select(PLAN_COLUMNS)
    .order("created_at", { ascending: false }) as unknown as {
    eq: (column: string, value: string) => typeof request;
    gte: (column: string, value: string) => typeof request;
    lte: (column: string, value: string) => typeof request;
    range: (from: number, to: number) => Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  };

  if (query.category && query.category !== "all") {
    request = request.eq("category", query.category);
  }
  if (query.dateFrom) request = request.gte("plan_date", query.dateFrom);
  if (query.dateTo) request = request.lte("plan_date", query.dateTo);

  const { data, error } = await request.range(offset, offset + limit);
  if (error || !data) return { plans: [], hasMore: false };

  const rows = data as DbPlan[];
  const hasMore = rows.length > limit;
  return {
    plans: rows.slice(0, limit).map(mapPlan),
    hasMore,
  };
}

/** Plans a member created or joined — not the whole catalog. */
export async function sbListPlansForMember(
  userId: string,
): Promise<{ plans: ActivityPlan[]; participants: PlanParticipant[] }> {
  const db = getDataClient();
  if (!db) return { plans: [], participants: [] };

  const [{ data: created }, { data: joined }] = await Promise.all([
    db
      .from("activity_plans")
      .select(PLAN_COLUMNS)
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("plan_participants")
      .select(PARTICIPANT_COLUMNS)
      .eq("user_id", userId)
      .eq("status", "joined")
      .limit(40),
  ]);

  const createdPlans = ((created || []) as DbPlan[]).map(mapPlan);
  const joinedRows = mapParticipants(joined);
  const known = new Set(createdPlans.map((plan) => plan.id));
  const extraIds = [
    ...new Set(joinedRows.map((row) => row.planId).filter((id) => !known.has(id))),
  ].slice(0, 20);

  let extraPlans: ActivityPlan[] = [];
  if (extraIds.length > 0) {
    const { data } = await db
      .from("activity_plans")
      .select(PLAN_COLUMNS)
      .in("id", extraIds);
    extraPlans = ((data || []) as DbPlan[]).map(mapPlan);
  }

  const plans = [...createdPlans, ...extraPlans];
  const participants = await sbListParticipantsForPlans(plans.map((plan) => plan.id));
  return { plans, participants };
}

export async function sbGetPlan(id: string): Promise<ActivityPlan | null> {
  const db = getDataClient();
  if (!db) return null;
  const { data } = await db
    .from("activity_plans")
    .select(PLAN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data ? mapPlan(data as DbPlan) : null;
}

function mapParticipants(
  data: unknown,
): PlanParticipant[] {
  return ((data || []) as Array<{
    plan_id: string;
    user_id: string;
    status: PlanParticipant["status"];
    joined_at: string;
  }>).map((row) => ({
    planId: row.plan_id,
    userId: row.user_id,
    status: row.status,
    joinedAt: row.joined_at,
  }));
}

export async function sbListParticipants(
  planId?: string,
): Promise<PlanParticipant[]> {
  const db = getDataClient();
  if (!db) return [];
  let query = db.from("plan_participants").select(PARTICIPANT_COLUMNS);
  if (planId) query = query.eq("plan_id", planId);
  else query = query.limit(200);
  const { data, error } = await query;
  if (error || !data) return [];
  return mapParticipants(data);
}

export async function sbListParticipantsForPlans(
  planIds: string[],
): Promise<PlanParticipant[]> {
  const db = getDataClient();
  if (!db || planIds.length === 0) return [];
  const { data, error } = await db
    .from("plan_participants")
    .select(PARTICIPANT_COLUMNS)
    .in("plan_id", planIds);
  if (error || !data) return [];
  return mapParticipants(data);
}

export async function sbJoinPlan(
  planId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDataClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const plan = await sbGetPlan(planId);
  if (!plan) return { ok: false, error: "Plan not found." };
  if (plan.creatorId === userId) {
    return { ok: false, error: "You’re the plan creator — you’re already in." };
  }

  const participants = await sbListParticipants(planId);
  const joined = participants.filter((p) => p.status === "joined");
  if (joined.some((p) => p.userId === userId)) return { ok: true };
  if (joined.length >= plan.peopleNeeded + 1) {
    return { ok: false, error: "This plan is full." };
  }

  const { error } = await db.from("plan_participants").upsert(
    {
      plan_id: planId,
      user_id: userId,
      status: "joined",
      joined_at: new Date().toISOString(),
    },
    { onConflict: "plan_id,user_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
