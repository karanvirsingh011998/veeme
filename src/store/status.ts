export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

/** Matches the existing short-lived network cache so navigation can reuse data. */
export const SHARED_CACHE_MS = 20_000;

export const CHAT_CACHE_MS = 15_000;

export function isFresh(fetchedAt: number, maxAge: number) {
  return fetchedAt > 0 && Date.now() - fetchedAt < maxAge;
}
