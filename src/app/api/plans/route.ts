import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import {
  sbCreatePlan,
  sbListParticipantsForPlans,
  sbListPlans,
  sbListPlansForMember,
} from "@/lib/plans/supabase";
import type { CreatePlanInput } from "@/lib/plans/types";

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateWindow(preset: string | null): { dateFrom?: string; dateTo?: string } {
  if (!preset || preset === "all") return {};
  const today = new Date();
  if (preset === "today") return { dateFrom: ymd(today), dateTo: ymd(today) };
  if (preset === "tomorrow") {
    const next = new Date(today);
    next.setDate(next.getDate() + 1);
    return { dateFrom: ymd(next), dateTo: ymd(next) };
  }
  if (preset === "weekend") {
    const day = today.getDay();
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + ((6 - day + 7) % 7));
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    return { dateFrom: ymd(saturday), dateTo: ymd(sunday) };
  }
  return {};
}

/**
 * GET /api/plans — paginated plans (+ participants for that page).
 * GET /api/plans?memberId= — plans that member created or joined.
 * POST /api/plans — create plan.
 */
export async function GET(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const params = new URL(request.url).searchParams;
  const memberId = params.get("memberId");
  if (memberId) {
    const result = await sbListPlansForMember(memberId);
    return NextResponse.json(result);
  }

  const limit = Number(params.get("limit") || 20);
  const offset = Number(params.get("offset") || 0);
  const category = params.get("category") || undefined;
  const window = dateWindow(params.get("date"));
  const { plans, hasMore } = await sbListPlans({
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
    category,
    ...window,
  });
  const participants = await sbListParticipantsForPlans(plans.map((plan) => plan.id));
  return NextResponse.json({ plans, participants, hasMore });
}

export async function POST(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as CreatePlanInput;
  if (!body?.creatorId) {
    return NextResponse.json({ error: "Missing creatorId." }, { status: 400 });
  }

  const result = await sbCreatePlan(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ plan: result.plan });
}
