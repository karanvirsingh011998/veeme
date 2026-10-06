import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import { sbGetConversation } from "@/lib/chat/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const { id } = await context.params;
  const conversation = await sbGetConversation(id);
  return NextResponse.json({ conversation });
}
