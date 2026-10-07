import { NextResponse } from "next/server";
import { canUseSupabaseData, getDataClient } from "@/lib/supabase/data";
import {
  countDevRatingsFor,
  listDevRatingsFor,
  saveDevRating,
} from "@/lib/people/rating-store";
import {
  isPersonRatingTier,
  type PersonRating,
  type PersonRatingCounts,
  type PersonRatingTier,
} from "@/lib/people/ratings";

type DbRating = {
  id: string;
  rater_id: string;
  subject_id: string;
  tier: PersonRatingTier;
  updated_at: string;
};

function mapRow(row: DbRating): PersonRating {
  return {
    id: row.id,
    raterId: row.rater_id,
    subjectId: row.subject_id,
    tier: row.tier,
    updatedAt: row.updated_at,
  };
}

/** True until `20261007120000_profile_ratings.sql` has been applied. */
function tableMissing(error: { message: string } | null) {
  const message = error?.message || "";
  return (
    message.includes("profile_ratings") &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}

function tally(rows: { tier: string }[]): PersonRatingCounts {
  const counts: PersonRatingCounts = { down: 0, up: 0, love: 0 };
  for (const row of rows) {
    if (isPersonRatingTier(row.tier)) counts[row.tier] += 1;
  }
  return counts;
}

/**
 * GET /api/people/ratings?raterId=   the viewer's own ratings
 * GET /api/people/ratings?subjectId= public totals only (no rater names)
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const subjectId = params.get("subjectId")?.trim() || "";
  const raterId = params.get("raterId")?.trim() || "";

  if (subjectId) {
    if (canUseSupabaseData()) {
      const db = getDataClient();
      if (!db) return NextResponse.json({ counts: tally([]) });
      const { data, error } = await db
        .from("profile_ratings")
        .select("tier")
        .eq("subject_id", subjectId);
      if (error) {
        if (tableMissing(error)) {
          return NextResponse.json({
            counts: await countDevRatingsFor(subjectId),
          });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        counts: tally((data || []) as { tier: string }[]),
      });
    }
    return NextResponse.json({ counts: await countDevRatingsFor(subjectId) });
  }

  if (!raterId) return NextResponse.json({ ratings: [] });

  if (canUseSupabaseData()) {
    const db = getDataClient();
    if (!db) return NextResponse.json({ ratings: [] });
    const { data, error } = await db
      .from("profile_ratings")
      .select("id, rater_id, subject_id, tier, updated_at")
      .eq("rater_id", raterId);
    if (error) {
      if (tableMissing(error)) {
        return NextResponse.json({ ratings: await listDevRatingsFor(raterId) });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      ratings: ((data || []) as DbRating[]).map(mapRow),
    });
  }

  return NextResponse.json({ ratings: await listDevRatingsFor(raterId) });
}

/**
 * POST /api/people/ratings
 * Body: { raterId, subjectId, tier: "down" | "up" | "love" | null }
 * null clears the rating.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    raterId?: string;
    subjectId?: string;
    tier?: unknown;
  } | null;

  const raterId = body?.raterId?.trim() || "";
  const subjectId = body?.subjectId?.trim() || "";
  const tier = body?.tier ?? null;

  if (!raterId || !subjectId) {
    return NextResponse.json(
      { error: "Choose who you are rating." },
      { status: 400 },
    );
  }
  if (raterId === subjectId) {
    return NextResponse.json(
      { error: "You can't rate yourself." },
      { status: 400 },
    );
  }
  if (tier !== null && !isPersonRatingTier(tier)) {
    return NextResponse.json({ error: "Unknown rating." }, { status: 400 });
  }

  if (canUseSupabaseData()) {
    const db = getDataClient();
    if (!db) {
      return NextResponse.json(
        { error: "Database unavailable." },
        { status: 503 },
      );
    }

    if (tier === null) {
      const { error } = await db
        .from("profile_ratings")
        .delete()
        .eq("rater_id", raterId)
        .eq("subject_id", subjectId);
      if (error) {
        if (tableMissing(error)) {
          await saveDevRating(raterId, subjectId, null);
          return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const now = new Date().toISOString();
    const { error } = await db.from("profile_ratings").upsert(
      {
        rater_id: raterId,
        subject_id: subjectId,
        tier,
        updated_at: now,
      },
      { onConflict: "rater_id,subject_id" },
    );
    if (error) {
      if (tableMissing(error)) {
        await saveDevRating(raterId, subjectId, tier);
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  await saveDevRating(raterId, subjectId, tier);
  return NextResponse.json({ ok: true });
}
