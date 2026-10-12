import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import { sbAddComment, sbListComments } from "@/lib/moments/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const { id } = await context.params;
  const comments = await sbListComments(id);
  return NextResponse.json({ comments });
}

export async function POST(request: Request, context: RouteContext) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const { id } = await context.params;
  const body = (await request.json()) as {
    authorId?: string;
    authorName?: string;
    body?: string;
  };
  if (!body.authorId || !body.body?.trim()) {
    return NextResponse.json({ error: "Write a comment." }, { status: 400 });
  }
  const result = await sbAddComment({
    momentId: id,
    authorId: body.authorId,
    authorName: body.authorName || "Member",
    body: body.body,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ comment: result.comment });
}
