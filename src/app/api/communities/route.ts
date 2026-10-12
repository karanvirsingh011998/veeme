import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import { sbCreateCommunity, sbListOwnedCommunities } from "@/lib/communities/supabase";
import type { CreateCommunityInput } from "@/lib/communities/types";

export async function GET(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const creatorId = new URL(request.url).searchParams.get("creatorId") || "";
  if (!creatorId) {
    return NextResponse.json({ error: "Missing creatorId." }, { status: 400 });
  }
  const communities = await sbListOwnedCommunities(creatorId);
  return NextResponse.json({ communities });
}

export async function POST(request: Request) {
  if (!canUseSupabaseData()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const body = (await request.json()) as CreateCommunityInput;
  if (!body?.creatorId || !body.name?.trim()) {
    return NextResponse.json({ error: "Name your community." }, { status: 400 });
  }
  const result = await sbCreateCommunity(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ community: result.community });
}
