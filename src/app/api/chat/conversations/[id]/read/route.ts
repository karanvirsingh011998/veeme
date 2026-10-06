import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import { sbMarkConversationRead } from "@/lib/chat/supabase";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/chat/conversations/[id]/read { userId }
 * Marks the conversation as read for this participant (last_read_at).
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
  if (!id || !body.userId) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }
  const ok = await sbMarkConversationRead(id, body.userId);
  if (!ok) {
    return NextResponse.json({ error: "Could not mark read." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
