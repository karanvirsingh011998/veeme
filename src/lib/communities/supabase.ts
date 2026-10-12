import { getDataClient } from "@/lib/supabase/data";
import type { CreateCommunityInput, OwnedCommunity } from "./types";
import { COMMUNITY_ICONS } from "./types";

type DbCommunity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_by: string | null;
  member_count: number;
  created_at: string;
};

const COLUMNS =
  "id, name, slug, description, icon, created_by, member_count, created_at";

function mapCommunity(row: DbCommunity): OwnedCommunity | null {
  if (!row.created_by) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon || "👥",
    creatorId: row.created_by,
    memberCount: row.member_count,
    createdAt: row.created_at,
  };
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "community"}-${suffix}`;
}

export async function sbListOwnedCommunities(
  creatorId: string,
): Promise<OwnedCommunity[]> {
  const db = getDataClient();
  if (!db) return [];
  const { data, error } = await db
    .from("communities")
    .select(COLUMNS)
    .eq("created_by", creatorId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return (data as DbCommunity[])
    .map(mapCommunity)
    .filter((item): item is OwnedCommunity => item !== null);
}

export async function sbCreateCommunity(
  input: CreateCommunityInput,
): Promise<{ ok: true; community: OwnedCommunity } | { ok: false; error: string }> {
  const db = getDataClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const icon = COMMUNITY_ICONS.includes(input.icon as (typeof COMMUNITY_ICONS)[number])
    ? input.icon
    : "👥";

  const { data, error } = await db
    .from("communities")
    .insert({
      name: input.name.trim(),
      slug: slugify(input.name),
      category: "communities",
      description: input.description.trim() || null,
      icon,
      created_by: input.creatorId,
      member_count: 1,
      is_public: true,
    })
    .select(COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Could not create community." };
  }

  const community = mapCommunity(data as DbCommunity);
  if (!community) return { ok: false, error: "Could not create community." };

  await db.from("community_members").insert({
    community_id: community.id,
    user_id: input.creatorId,
    role: "admin",
  });

  return { ok: true, community };
}

export async function sbCommunityOwnedBy(
  communityId: string,
  userId: string,
): Promise<boolean> {
  const db = getDataClient();
  if (!db) return false;
  const { data } = await db
    .from("communities")
    .select("id, created_by")
    .eq("id", communityId)
    .maybeSingle();
  const row = data as { created_by?: string | null } | null;
  return row?.created_by === userId;
}
