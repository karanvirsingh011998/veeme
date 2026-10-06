import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import { sbCreatePlan, sbListParticipants, sbListPlans } from "@/lib/plans/supabase";
import type { CreatePlanInput } from "@/lib/plans/types";

/**
 * GET /api/plans — list plans (+ participants).
 * POST /api/plans — create plan.
 */
export async function GET() {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const plans = await sbListPlans();
  const participants = await sbListParticipants();
  return NextResponse.json({ plans, participants });
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
