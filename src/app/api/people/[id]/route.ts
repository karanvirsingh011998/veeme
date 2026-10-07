import { NextResponse } from "next/server";
import { canUseSupabaseData, getDataClient } from "@/lib/supabase/data";
import { getDevProfile } from "@/lib/profile/dev-store";
import type { PublicProfileDto } from "@/lib/people/types";
import type { ProfileRow } from "@/types/database";

const PROFILE_SELECT =
  "id, first_name, last_name, display_name, city, bio, avatar_url, phone_verified_at, account_status, interests";

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

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/people/[id] — public profile card for a member.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (canUseSupabaseData()) {
    const db = getDataClient();
    if (!db) {
      return NextResponse.json({ error: "Unavailable" }, { status: 503 });
    }
    const { data } = await db
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", id)
      .maybeSingle();
    const profile = data as ProfileRow | null;
    if (!profile || profile.account_status !== "active") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ person: toPublic(profile) });
  }

  const profile = await getDevProfile(id);
  if (!profile || profile.account_status !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ person: toPublic(profile) });
}
