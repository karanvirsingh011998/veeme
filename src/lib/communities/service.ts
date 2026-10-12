import { isSupabaseConfigured } from "@/lib/auth/config";
import { listStoredCommunities, upsertStoredCommunity } from "./store";
import { COMMUNITY_ICONS, type CreateCommunityInput, type OwnedCommunity } from "./types";

function useRemote() {
  return typeof window !== "undefined" && isSupabaseConfigured();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `community_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function listOwnedCommunities(creatorId: string): Promise<OwnedCommunity[]> {
  if (!creatorId) return [];
  if (useRemote()) {
    const res = await fetch(
      `/api/communities?creatorId=${encodeURIComponent(creatorId)}`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { communities?: OwnedCommunity[] };
    return data.communities || [];
  }
  return listStoredCommunities(creatorId);
}

export async function createCommunity(
  input: CreateCommunityInput,
): Promise<{ ok: true; community: OwnedCommunity } | { ok: false; error: string }> {
  const name = input.name.trim();
  const description = input.description.trim();
  if (name.length < 2) return { ok: false, error: "Name your community." };
  if (name.length > 80) return { ok: false, error: "Keep the name under 80 characters." };
  if (description.length > 300) {
    return { ok: false, error: "Keep the description under 300 characters." };
  }
  const icon = COMMUNITY_ICONS.includes(input.icon as (typeof COMMUNITY_ICONS)[number])
    ? input.icon
    : "👥";

  if (useRemote()) {
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, name, description, icon }),
    });
    const data = (await res.json()) as { community?: OwnedCommunity; error?: string };
    if (!res.ok || !data.community) {
      return { ok: false, error: data.error || "Could not create community." };
    }
    return { ok: true, community: data.community };
  }

  const community: OwnedCommunity = {
    id: newId(),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "community",
    description: description || null,
    icon,
    creatorId: input.creatorId,
    memberCount: 1,
    createdAt: new Date().toISOString(),
  };
  upsertStoredCommunity(community);
  return { ok: true, community };
}
