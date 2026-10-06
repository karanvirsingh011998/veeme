import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import {
  sbGetPlan,
  sbJoinPlan,
  sbListParticipants,
} from "@/lib/plans/supabase";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/plans/[id]
 */
export async function GET(_request: Request, context: RouteContext) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const { id } = await context.params;
  const plan = await sbGetPlan(id);
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }
  const participants = await sbListParticipants(id);
  return NextResponse.json({ plan, participants });
}

/**
 * POST /api/plans/[id] — join plan { userId }
 */
export async function POST(request: Request, context: RouteContext) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const { id } = await context.params;
  const body = (await request.json()) as { userId?: string };
  if (!body.userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }
  const result = await sbJoinPlan(id, body.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
