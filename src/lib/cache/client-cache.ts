type Entry = { value: unknown; at: number };

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/** Fresh value, or null when missing or older than `maxAgeMs`. */
export function peekCache<T>(key: string, maxAgeMs: number): T | null {
  const hit = memory.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > maxAgeMs) return null;
  return hit.value as T;
}

/** Last value even if the TTL has passed. */
export function peekStale<T>(key: string): T | null {
  const hit = memory.get(key);
  return hit ? (hit.value as T) : null;
}

export function writeCache<T>(key: string, value: T) {
  memory.set(key, { value, at: Date.now() });
}

export function invalidateCache(prefix: string) {
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
}

/** Collapse identical in-flight requests into one network call. */
export function deduped<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const pending = loader().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, pending);
  return pending;
}

/**
 * Stale-while-revalidate.
 * Returns cached data immediately when present, and refreshes in the background
 * once the TTL has passed. `onUpdate` receives the fresh payload.
 */
export function loadSwr<T>(
  key: string,
  maxAgeMs: number,
  loader: () => Promise<T>,
  onUpdate?: (value: T) => void,
): Promise<T> {
  const fresh = peekCache<T>(key, maxAgeMs);
  if (fresh) return Promise.resolve(fresh);

  const pending = deduped(key, async () => {
    const value = await loader();
    writeCache(key, value);
    onUpdate?.(value);
    return value;
  });

  const stale = peekStale<T>(key);
  if (stale) {
    void pending;
    return Promise.resolve(stale);
  }
  return pending;
}
