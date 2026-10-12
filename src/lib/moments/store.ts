import type { Moment, MomentComment } from "./types";

const MOMENTS_KEY = "vemee_moments_v1";
const COMMENTS_KEY = "vemee_moment_comments_v1";
const LIKES_KEY = "vemee_moment_likes_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function listStoredMoments(): Moment[] {
  return readJson<Moment[]>(MOMENTS_KEY, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function upsertStoredMoment(moment: Moment): void {
  const next = listStoredMoments().filter((item) => item.id !== moment.id);
  next.unshift(moment);
  writeJson(MOMENTS_KEY, next);
}

export function listStoredComments(momentId: string): MomentComment[] {
  return readJson<MomentComment[]>(COMMENTS_KEY, [])
    .filter((item) => item.momentId === momentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addStoredComment(comment: MomentComment): void {
  const all = readJson<MomentComment[]>(COMMENTS_KEY, []);
  all.push(comment);
  writeJson(COMMENTS_KEY, all);
}

export function readLikedMomentIds(): string[] {
  return readJson<string[]>(LIKES_KEY, []);
}

export function toggleStoredLike(momentId: string): boolean {
  const liked = new Set(readLikedMomentIds());
  const next = !liked.has(momentId);
  if (next) liked.add(momentId);
  else liked.delete(momentId);
  writeJson(LIKES_KEY, [...liked]);
  return next;
}
