import type { OwnedCommunity } from "./types";

const KEY = "vemee_owned_communities_v1";

function read(): OwnedCommunity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OwnedCommunity[]) : [];
  } catch {
    return [];
  }
}

function write(items: OwnedCommunity[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function listStoredCommunities(creatorId?: string): OwnedCommunity[] {
  const items = read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return creatorId ? items.filter((item) => item.creatorId === creatorId) : items;
}

export function upsertStoredCommunity(community: OwnedCommunity): void {
  const next = read().filter((item) => item.id !== community.id);
  next.unshift(community);
  write(next);
}
