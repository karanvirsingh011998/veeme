import { NextResponse } from "next/server";
import { canUseSupabaseData, getDataClient } from "@/lib/supabase/data";
import { listDevProfiles } from "@/lib/profile/dev-store";
import type { PublicProfileDto } from "@/lib/people/types";
import type { ProfileRow } from "@/types/database";

const PROFILE_SELECT =
  "id, first_name, last_name, display_name, city, bio, avatar_url, phone_verified_at, account_status";

function toPublic(profile: ProfileRow): PublicProfileDto {
  const interests =
    (profile as ProfileRow & { interests?: string[] }).interests || [];
  return {
    id: profile.id,
    name:
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.display_name ||
      "Vemee member",
    city: profile.city,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    verified: Boolean(profile.phone_verified_at),
    interests: interests.slice(0, 8),
  };
}

/**
 * GET /api/people?ids=a,b  OR  GET /api/people?exclude=userId
 * Public member cards for plans/people/chat.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const exclude = searchParams.get("exclude");
  const ids = idsParam
    ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  if (canUseSupabaseData()) {
    const db = getDataClient();
    if (!db) {
      return NextResponse.json({ error: "Unavailable" }, { status: 503 });
    }

    if (ids) {
      const { data } = await db
        .from("profiles")
        .select(PROFILE_SELECT)
        .in("id", ids);
      const people = ((data || []) as ProfileRow[])
        .filter((p) => p.account_status === "active")
        .map(toPublic);
      return NextResponse.json({ people });
    }

    const { data } = await db
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("account_status", "active")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 20));

    let people = ((data || []) as ProfileRow[]).map(toPublic);
    if (exclude) people = people.filter((p) => p.id !== exclude);
    return NextResponse.json({ people });
  }

  // Dev file store so profiles are shared across browsers locally.
  const all = await listDevProfiles();
  if (ids) {
    const idSet = new Set(ids);
    return NextResponse.json({
      people: all
        .filter((p) => idSet.has(p.id) && p.account_status === "active")
        .map(toPublic),
    });
  }

  let people = all
    .filter((p) => p.account_status === "active")
    .map(toPublic);
  if (exclude) people = people.filter((p) => p.id !== exclude);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 20);
  return NextResponse.json({ people: people.slice(0, limit) });
}
