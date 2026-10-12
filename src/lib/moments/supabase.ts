import { getDataClient } from "@/lib/supabase/data";
import { sbCommunityOwnedBy } from "@/lib/communities/supabase";
import type { CreateMomentInput, Moment, MomentComment } from "./types";

type DbMoment = {
  id: string;
  author_id: string;
  audience?: string | null;
  community_id?: string | null;
  body: string;
  media_url: string | null;
  like_count: number;
  created_at: string;
};

type DbComment = {
  id: string;
  moment_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

const MOMENT_COLUMNS =
  "id, author_id, audience, community_id, body, media_url, like_count, created_at";

const MOMENT_COLUMNS_LEGACY =
  "id, author_id, body, media_url, like_count, created_at";

function missingAudienceColumn(error: { message: string } | null | undefined) {
  return Boolean(error && /audience|community_id/i.test(error.message));
}

function mapMoment(
  row: DbMoment,
  names: Map<string, string>,
  communityNames: Map<string, string>,
): Moment {
  const audience = row.audience === "community" ? "community" : "individual";
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: names.get(row.author_id) || "Member",
    audience,
    communityId: row.community_id ?? null,
    communityName: row.community_id
      ? communityNames.get(row.community_id) || null
      : null,
    body: row.body,
    imageUrl: row.media_url,
    likeCount: row.like_count ?? 0,
    createdAt: row.created_at,
  };
}

async function profileName(userId: string): Promise<string> {
  const names = await profileNames([userId]);
  return names.get(userId) || "Member";
}

async function profileNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  const db = getDataClient();
  if (!db || unique.length === 0) return map;
  const { data } = await db
    .from("profiles")
    .select("id, first_name, last_name, display_name")
    .in("id", unique);
  for (const row of (data || []) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
  }>) {
    const name =
      [row.first_name, row.last_name].filter(Boolean).join(" ") ||
      row.display_name ||
      "Member";
    map.set(row.id, name);
  }
  return map;
}

async function communityNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  const db = getDataClient();
  if (!db || unique.length === 0) return map;
  const { data } = await db.from("communities").select("id, name").in("id", unique);
  for (const row of (data || []) as Array<{ id: string; name: string }>) {
    map.set(row.id, row.name);
  }
  return map;
}

export async function sbListMoments(): Promise<Moment[]> {
  const db = getDataClient();
  if (!db) return [];
  const { data, error } = await db
    .from("moments")
    .select(MOMENT_COLUMNS)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(40);
  const rows = (
    missingAudienceColumn(error)
      ? (
          await db
            .from("moments")
            .select(MOMENT_COLUMNS_LEGACY)
            .eq("is_hidden", false)
            .order("created_at", { ascending: false })
            .limit(40)
        ).data
      : error
        ? null
        : data
  ) as DbMoment[] | null;
  if (!rows) return [];
  const names = await profileNames(rows.map((row) => row.author_id));
  const communities = await communityNames(
    rows.map((row) => row.community_id || "").filter(Boolean),
  );
  return rows.map((row) => mapMoment(row, names, communities));
}

export async function sbCreateMoment(
  input: CreateMomentInput,
): Promise<{ ok: true; moment: Moment } | { ok: false; error: string }> {
  const db = getDataClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  if (input.audience === "community") {
    if (!input.communityId) {
      return { ok: false, error: "Choose one of your communities." };
    }
    const owned = await sbCommunityOwnedBy(input.communityId, input.authorId);
    if (!owned) {
      return { ok: false, error: "You can only post to a community you created." };
    }
  }

  const body = input.body.trim();
  const payload = {
    author_id: input.authorId,
    type: "update",
    category: "other",
    title: body.slice(0, 80) || "Moment",
    body,
    audience: input.audience,
    community_id: input.audience === "community" ? input.communityId : null,
    media_url: input.imageUrl?.trim() || null,
    like_count: 0,
    comment_count: 0,
    is_hidden: false,
  };
  let { data, error } = await db
    .from("moments")
    .insert(payload)
    .select(MOMENT_COLUMNS)
    .single();

  if (missingAudienceColumn(error) && input.audience === "individual") {
    const { audience: _audience, community_id: _communityId, ...legacy } = payload;
    const retry = await db
      .from("moments")
      .insert(legacy)
      .select(MOMENT_COLUMNS_LEGACY)
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    if (missingAudienceColumn(error) && input.audience === "community") {
      return {
        ok: false,
        error: "Run the community migration before posting to a community.",
      };
    }
    return { ok: false, error: error?.message || "Could not share that moment." };
  }

  const names = new Map<string, string>([
    [input.authorId, input.authorName || (await profileName(input.authorId))],
  ]);
  const communities = input.communityId
    ? await communityNames([input.communityId])
    : new Map<string, string>();
  return { ok: true, moment: mapMoment(data as DbMoment, names, communities) };
}

export async function sbListComments(momentId: string): Promise<MomentComment[]> {
  const db = getDataClient();
  if (!db) return [];
  const { data, error } = await db
    .from("moment_comments")
    .select("id, moment_id, author_id, body, created_at")
    .eq("moment_id", momentId)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error || !data) return [];
  const rows = data as DbComment[];
  const names = await profileNames(rows.map((row) => row.author_id));
  return rows.map((row) => ({
    id: row.id,
    momentId: row.moment_id,
    authorId: row.author_id,
    authorName: names.get(row.author_id) || "Member",
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function sbAddComment(input: {
  momentId: string;
  authorId: string;
  authorName: string;
  body: string;
}): Promise<{ ok: true; comment: MomentComment } | { ok: false; error: string }> {
  const db = getDataClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };
  const { data, error } = await db
    .from("moment_comments")
    .insert({
      moment_id: input.momentId,
      author_id: input.authorId,
      body: input.body.trim(),
    })
    .select("id, moment_id, author_id, body, created_at")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message || "Could not add that comment." };
  }
  const row = data as DbComment;
  return {
    ok: true,
    comment: {
      id: row.id,
      momentId: row.moment_id,
      authorId: row.author_id,
      authorName: input.authorName || "Member",
      body: row.body,
      createdAt: row.created_at,
    },
  };
}
