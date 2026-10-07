import { promises as fs } from "fs";
import path from "path";
import type {
  PersonRating,
  PersonRatingCounts,
  PersonRatingTier,
} from "./ratings";

const STORE_PATH = path.join(process.cwd(), ".data", "dev-profile-ratings.json");

async function readAll(): Promise<PersonRating[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as PersonRating[];
  } catch {
    return [];
  }
}

async function writeAll(rows: PersonRating[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(rows, null, 2), "utf8");
}

export async function countDevRatingsFor(
  subjectId: string,
): Promise<PersonRatingCounts> {
  const rows = await readAll();
  const counts: PersonRatingCounts = { down: 0, up: 0, love: 0 };
  for (const row of rows) {
    if (row.subjectId === subjectId) counts[row.tier] += 1;
  }
  return counts;
}

export async function listDevRatingsFor(raterId: string): Promise<PersonRating[]> {
  const rows = await readAll();
  return rows.filter((row) => row.raterId === raterId);
}

export async function saveDevRating(
  raterId: string,
  subjectId: string,
  tier: PersonRatingTier | null,
): Promise<void> {
  const rows = await readAll();
  const rest = rows.filter(
    (row) => !(row.raterId === raterId && row.subjectId === subjectId),
  );
  if (tier) {
    const now = new Date().toISOString();
    rest.unshift({
      id: `${raterId}:${subjectId}`,
      raterId,
      subjectId,
      tier,
      updatedAt: now,
    });
  }
  await writeAll(rest);
}
