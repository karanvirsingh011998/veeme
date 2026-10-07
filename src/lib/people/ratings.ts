import type { PublicProfileDto } from "@/lib/people/types";

/** Netflix-style tiers: not for me, I like them, love this. */
export type PersonRatingTier = "down" | "up" | "love";

export type PersonRating = {
  id: string;
  raterId: string;
  subjectId: string;
  tier: PersonRatingTier;
  updatedAt: string;
};

export type PersonRatingCounts = {
  down: number;
  up: number;
  love: number;
};

export const EMPTY_RATING_COUNTS: PersonRatingCounts = {
  down: 0,
  up: 0,
  love: 0,
};

export function shiftRatingCounts(
  counts: PersonRatingCounts,
  previous: PersonRatingTier | null,
  next: PersonRatingTier | null,
): PersonRatingCounts {
  const shifted = { ...counts };
  if (previous) shifted[previous] = Math.max(0, shifted[previous] - 1);
  if (next) shifted[next] += 1;
  return shifted;
}

export function isPersonRatingTier(value: unknown): value is PersonRatingTier {
  return value === "down" || value === "up" || value === "love";
}

export async function getPersonRatingCounts(
  subjectId: string,
): Promise<PersonRatingCounts> {
  if (!subjectId) return { ...EMPTY_RATING_COUNTS };
  const res = await fetch(
    `/api/people/ratings?subjectId=${encodeURIComponent(subjectId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ...EMPTY_RATING_COUNTS };
  const data = (await res.json()) as { counts?: PersonRatingCounts };
  return {
    down: data.counts?.down ?? 0,
    up: data.counts?.up ?? 0,
    love: data.counts?.love ?? 0,
  };
}

export async function listMyPersonRatings(
  raterId: string,
): Promise<PersonRating[]> {
  if (!raterId) return [];
  const res = await fetch(
    `/api/people/ratings?raterId=${encodeURIComponent(raterId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { ratings?: PersonRating[] };
  return data.ratings ?? [];
}

export async function savePersonRating(
  raterId: string,
  subjectId: string,
  tier: PersonRatingTier | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/people/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raterId, subjectId, tier }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return { ok: false, error: data.error || "Couldn't save that rating." };
  }
  return { ok: true };
}

/**
 * Adjust a candidate's recommendation score from the viewer's ratings.
 * Thumbs down lowers people who share that person's interests or city.
 * Thumbs up raises similar people. Double thumbs up raises them more,
 * especially shared interests (the stand-in for cast, director, and genre).
 */
export function ratingAdjustment(
  person: Pick<PublicProfileDto, "id" | "city" | "interests">,
  catalog: Array<Pick<PublicProfileDto, "id" | "city" | "interests">>,
  ratings: ReadonlyMap<string, PersonRatingTier>,
): number {
  if (ratings.size === 0) return 0;

  let score = 0;
  const mine = ratings.get(person.id);
  if (mine === "down") score -= 40;
  else if (mine === "up") score += 1;
  else if (mine === "love") score += 2;

  const interestWeight = new Map<string, number>();
  const cityWeight = new Map<string, number>();

  for (const other of catalog) {
    const tier = ratings.get(other.id);
    if (!tier || other.id === person.id) continue;
    const interestBoost = tier === "down" ? -6 : tier === "up" ? 4 : 8;
    const cityBoost = tier === "down" ? -5 : tier === "up" ? 3 : 6;
    for (const interest of other.interests) {
      const key = interest.toLowerCase();
      interestWeight.set(key, (interestWeight.get(key) || 0) + interestBoost);
    }
    if (other.city) {
      const key = other.city.toLowerCase();
      cityWeight.set(key, (cityWeight.get(key) || 0) + cityBoost);
    }
  }

  for (const interest of person.interests) {
    score += interestWeight.get(interest.toLowerCase()) || 0;
  }
  if (person.city) score += cityWeight.get(person.city.toLowerCase()) || 0;
  return score;
}
