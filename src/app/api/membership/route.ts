import { NextResponse } from "next/server";
import { canUseSupabaseData, getDataClient } from "@/lib/supabase/data";
import {
  DEFAULT_MEMBERSHIP_PLANS,
  isMembershipKey,
  type MembershipFeatures,
  type MembershipKey,
  type MembershipPlan,
} from "@/lib/membership/catalog";
import { getDevMembership, setDevMembership } from "@/lib/membership/store";

type DbPlan = {
  key: string;
  name: string;
  price_paise: number;
  currency: string;
  sort_order: number;
  features: MembershipFeatures | null;
};

function mapPlan(row: DbPlan): MembershipPlan | null {
  if (!isMembershipKey(row.key)) return null;
  const highlights = Array.isArray(row.features?.highlights)
    ? row.features.highlights.filter((item) => typeof item === "string")
    : [];
  return {
    key: row.key,
    name: row.name,
    pricePaise: row.price_paise,
    currency: row.currency || "INR",
    sortOrder: row.sort_order,
    features: {
      tagline: row.features?.tagline || "",
      highlights,
    },
  };
}

function missingRelation(error: { message: string } | null) {
  const message = error?.message || "";
  return (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("membership_key") ||
    message.includes("membership_plans")
  );
}

async function listPlans(): Promise<MembershipPlan[]> {
  if (!canUseSupabaseData()) return DEFAULT_MEMBERSHIP_PLANS;
  const db = getDataClient();
  if (!db) return DEFAULT_MEMBERSHIP_PLANS;
  const { data, error } = await db
    .from("membership_plans")
    .select("key, name, price_paise, currency, sort_order, features")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return DEFAULT_MEMBERSHIP_PLANS;
  const plans = (data as DbPlan[])
    .map(mapPlan)
    .filter((plan): plan is MembershipPlan => Boolean(plan));
  return plans.length > 0 ? plans : DEFAULT_MEMBERSHIP_PLANS;
}

async function currentKey(userId: string): Promise<MembershipKey> {
  if (!userId) return "free";
  if (!canUseSupabaseData()) return getDevMembership(userId);
  const db = getDataClient();
  if (!db) return getDevMembership(userId);
  const { data, error } = await db
    .from("profiles")
    .select("membership_key")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    if (missingRelation(error)) return getDevMembership(userId);
    return "free";
  }
  const key = (data as { membership_key?: string } | null)?.membership_key;
  return isMembershipKey(key) ? key : "free";
}

/**
 * GET /api/membership?userId=
 * Public catalog plus the viewer's current plan. Missing user is Free.
 */
export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId")?.trim() || "";
  const plans = await listPlans();
  const membershipKey = userId ? await currentKey(userId) : "free";
  return NextResponse.json({ plans, membershipKey });
}

/**
 * POST /api/membership
 * Body: { userId, planKey }
 * Switches the account. Payment is not collected yet.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    planKey?: string;
  } | null;
  const userId = body?.userId?.trim() || "";
  const planKey = body?.planKey;

  if (!userId) {
    return NextResponse.json(
      { error: "Log in to change your plan." },
      { status: 401 },
    );
  }
  if (!isMembershipKey(planKey) || planKey === "free") {
    return NextResponse.json(
      { error: "Choose Pro, Ultra Pro, or Ultra Promax." },
      { status: 400 },
    );
  }

  const plans = await listPlans();
  if (!plans.some((plan) => plan.key === planKey)) {
    return NextResponse.json({ error: "That plan is not available." }, { status: 400 });
  }

  const existing = await currentKey(userId);
  if (existing === planKey) {
    return NextResponse.json({ ok: true, membershipKey: planKey });
  }

  if (canUseSupabaseData()) {
    const db = getDataClient();
    if (db) {
      const { error } = await db
        .from("profiles")
        .update({ membership_key: planKey, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (!error) return NextResponse.json({ ok: true, membershipKey: planKey });
      if (!missingRelation(error)) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  await setDevMembership(userId, planKey);
  return NextResponse.json({ ok: true, membershipKey: planKey });
}
