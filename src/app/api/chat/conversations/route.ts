import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import {
  sbGetOrCreateDirect,
  sbListConversationSummariesFor,
} from "@/lib/chat/supabase";

/**
 * GET /api/chat/conversations?userId=
 * POST /api/chat/conversations { userA, userB }
 */
export async function GET(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }
  const conversations = await sbListConversationSummariesFor(userId);
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  return NextResponse.json({ conversations, unreadTotal });
}

export async function POST(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const body = (await request.json()) as { userA?: string; userB?: string };
  if (!body.userA || !body.userB) {
    return NextResponse.json({ error: "Missing participants." }, { status: 400 });
  }
  const conversation = await sbGetOrCreateDirect(body.userA, body.userB);
  if (!conversation) {
    return NextResponse.json({ error: "Could not create chat." }, { status: 500 });
  }
  return NextResponse.json({ conversation });
}
