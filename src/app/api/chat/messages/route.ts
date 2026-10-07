import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import { sbListMessages, sbSendMessage } from "@/lib/chat/supabase";

/**
 * GET /api/chat/messages?conversationId=
 * POST /api/chat/messages { conversationId, senderId, body }
 */
export async function GET(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const params = new URL(request.url).searchParams;
  const conversationId = params.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });
  }
  const limit = Number(params.get("limit") || 40);
  const page = await sbListMessages(conversationId, {
    limit: Number.isFinite(limit) ? limit : 40,
    before: params.get("before") || undefined,
    after: params.get("after") || undefined,
  });
  return NextResponse.json(page);
}

export async function POST(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const body = (await request.json()) as {
    conversationId?: string;
    senderId?: string;
    body?: string;
  };
  if (!body.conversationId || !body.senderId || !body.body) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }
  const result = await sbSendMessage(
    body.conversationId,
    body.senderId,
    body.body,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ message: result.message });
}
