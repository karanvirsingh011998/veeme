import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import { sbCreateMoment, sbListMoments } from "@/lib/moments/supabase";
import type { CreateMomentInput } from "@/lib/moments/types";

export async function GET() {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const moments = await sbListMoments();
  return NextResponse.json({ moments });
}

export async function POST(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const body = (await request.json()) as CreateMomentInput;
  if (!body?.authorId || !body.body?.trim()) {
    return NextResponse.json({ error: "Write a short moment." }, { status: 400 });
  }
  const result = await sbCreateMoment(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ moment: result.moment });
}
