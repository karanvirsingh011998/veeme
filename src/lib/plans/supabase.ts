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
    .select("*")
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

export async function sbListPlans(): Promise<ActivityPlan[]> {
  const db = getDataClient();
  if (!db) return [];
  const { data, error } = await db
    .from("activity_plans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return (data as DbPlan[]).map(mapPlan);
}

export async function sbGetPlan(id: string): Promise<ActivityPlan | null> {
  const db = getDataClient();
  if (!db) return null;
  const { data } = await db
    .from("activity_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapPlan(data as DbPlan) : null;
}

export async function sbListParticipants(
  planId?: string,
): Promise<PlanParticipant[]> {
  const db = getDataClient();
  if (!db) return [];
  let query = db.from("plan_participants").select("*");
  if (planId) query = query.eq("plan_id", planId);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Array<{
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
