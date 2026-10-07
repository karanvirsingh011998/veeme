import { PROFILE_STORE_KEY } from "@/lib/auth/constants";
import { loadSwr } from "@/lib/cache/client-cache";
import type { ProfileRow } from "@/types/database";
import { listStoredPlans, listStoredParticipants } from "@/lib/plans/store";
import {
  distanceKm,
  formatApproxDistance,
  type ApproxLocation,
} from "@/lib/location/geo";
import {
  getConnectionBetween,
  listConnectionsForAsync,
  type Connection,
} from "@/lib/connections/service";
import type { PublicProfileDto } from "@/lib/people/types";

export type PeopleCard = {
  id: string;
  name: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  interests: string[];
  rating: number | null;
  verified: boolean;
  distanceLabel: string | null;
  connectionStatus: "none" | "pending_sent" | "pending_received" | "connected";
};

function readLocalProfiles(): ProfileRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROFILE_STORE_KEY);
    if (!raw) return [];
    const store = JSON.parse(raw) as Record<string, ProfileRow>;
    return Object.values(store).filter((p) => p.account_status === "active");
  } catch {
    return [];
  }
}

function interestOverlap(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 0;
  const set = new Set(a.map((x) => x.toLowerCase()));
  return b.filter((x) => set.has(x.toLowerCase())).length;
}

function statusFromConnection(
  viewerId: string | undefined,
  userId: string,
  connection: Connection | null | undefined,
): PeopleCard["connectionStatus"] {
  if (!viewerId || !connection) return "none";
  if (connection.status === "accepted") return "connected";
  if (connection.status === "pending") {
    return connection.requesterId === viewerId
      ? "pending_sent"
      : "pending_received";
  }
  return "none";
}

function connectionStatusFor(
  viewerId: string | undefined,
  userId: string,
): PeopleCard["connectionStatus"] {
  if (!viewerId) return "none";
  return statusFromConnection(
    viewerId,
    userId,
    getConnectionBetween(viewerId, userId),
  );
}

function dtoToCard(
  dto: PublicProfileDto,
  viewerId?: string,
  distanceLabel?: string | null,
  connection?: Connection | null,
): PeopleCard {
  return {
    id: dto.id,
    name: dto.name,
    city: dto.city,
    bio: dto.bio,
    avatarUrl: dto.avatarUrl,
    interests: dto.interests,
    rating: null,
    verified: dto.verified,
    distanceLabel: distanceLabel ?? dto.city,
    connectionStatus:
      connection !== undefined
        ? statusFromConnection(viewerId, dto.id, connection)
        : connectionStatusFor(viewerId, dto.id),
  };
}

function localRowToCard(
  profile: ProfileRow,
  viewerId?: string,
): PeopleCard {
  const interests =
    (profile as ProfileRow & { interests?: string[] }).interests || [];
  return {
    id: profile.id,
    name:
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.display_name ||
      "Vemee member",
    city: profile.city,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    interests,
    rating: null,
    verified: Boolean(profile.phone_verified_at),
    distanceLabel: profile.city,
    connectionStatus: connectionStatusFor(viewerId, profile.id),
  };
}

function findConnection(
  connections: Connection[],
  viewerId: string,
  otherId: string,
): Connection | null {
  return (
    connections.find(
      (c) =>
        (c.requesterId === viewerId && c.recipientId === otherId) ||
        (c.requesterId === otherId && c.recipientId === viewerId),
    ) ?? null
  );
}

/**
 * Fetch public profiles from the shared API (Supabase or server dev store).
 */
async function fetchPublicProfiles(opts?: {
  ids?: string[];
  exclude?: string;
}): Promise<PublicProfileDto[]> {
  if (typeof window === "undefined") return [];
  try {
    const params = new URLSearchParams();
    if (opts?.ids?.length) params.set("ids", opts.ids.join(","));
    if (opts?.exclude) {
      params.set("exclude", opts.exclude);
      params.set("limit", "20");
    }
    const qs = params.toString();
    return await loadSwr(`people:${qs || "all"}`, 20_000, async () => {
      const res = await fetch(`/api/people${qs ? `?${qs}` : ""}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { people?: PublicProfileDto[] };
      return data.people || [];
    });
  } catch {
    return [];
  }
}

/**
 * Recommends real authenticated profiles — never invents fake people.
 */
export async function listPeopleYouMayConnectWith(
  currentUserId: string,
  opts?: {
    userLocation?: ApproxLocation | null;
    currentInterests?: string[];
  },
): Promise<PeopleCard[]> {
  const remote = await fetchPublicProfiles({
    exclude: currentUserId,
  });
  const profiles: PublicProfileDto[] =
    remote.length > 0
      ? remote
      : readLocalProfiles()
          .filter((p) => p.id !== currentUserId)
          .map((p) => ({
            id: p.id,
            name:
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              p.display_name ||
              "Vemee member",
            city: p.city,
            bio: p.bio,
            avatarUrl: p.avatar_url,
            verified: Boolean(p.phone_verified_at),
            interests:
              (p as ProfileRow & { interests?: string[] }).interests || [],
          }));

  if (profiles.length === 0) return [];

  const connections = await listConnectionsForAsync(currentUserId);

  const myPlanCategories = new Set(
    listStoredPlans()
      .filter((p) => {
        if (p.creatorId === currentUserId) return true;
        return listStoredParticipants(p.id).some(
          (x) => x.userId === currentUserId && x.status === "joined",
        );
      })
      .map((p) => p.category),
  );

  const scored = profiles.map((profile) => {
    const interests = profile.interests || [];
    let score = 0;
    score += interestOverlap(opts?.currentInterests, interests) * 3;
    if (profile.city && opts?.userLocation?.city) {
      if (
        profile.city.toLowerCase() === opts.userLocation.city.toLowerCase()
      ) {
        score += 4;
      }
    }

    const theirPlans = listStoredPlans().filter(
      (p) => p.creatorId === profile.id,
    );
    if (theirPlans.some((p) => myPlanCategories.has(p.category))) score += 2;

    let distanceLabel: string | null = null;
    if (profile.city && opts?.userLocation?.city) {
      distanceLabel =
        profile.city.toLowerCase() === opts.userLocation.city.toLowerCase()
          ? `Near ${profile.city}`
          : profile.city;
    } else if (profile.city) {
      distanceLabel = profile.city;
    }

    void distanceKm;
    void formatApproxDistance;

    const connection = findConnection(connections, currentUserId, profile.id);

    return {
      score,
      card: dtoToCard(profile, currentUserId, distanceLabel, connection),
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((s) => s.card);
}

/** Sync local-only lookup (fallback). Prefer getPublicProfileCardAsync. */
export function getPublicProfileCard(
  userId: string,
  viewerId?: string,
): PeopleCard | null {
  const profile = readLocalProfiles().find((p) => p.id === userId);
  if (!profile) return null;
  return localRowToCard(profile, viewerId);
}

/**
 * Public profile for plans/people/chat — API first, then local store.
 */
export async function getPublicProfileCardAsync(
  userId: string,
  viewerId?: string,
): Promise<PeopleCard | null> {
  if (!userId) return null;

  const connection = viewerId
    ? (await listConnectionsForAsync(viewerId)).find(
        (c) =>
          (c.requesterId === viewerId && c.recipientId === userId) ||
          (c.requesterId === userId && c.recipientId === viewerId),
      ) ?? null
    : null;

  if (typeof window !== "undefined") {
    // Prefer ?ids= (same path as plan creator cards), then /[id].
    try {
      const batch = await fetchPublicProfiles({ ids: [userId] });
      const match = batch.find((p) => p.id === userId);
      if (match) return dtoToCard(match, viewerId, undefined, connection);
    } catch {
      // continue
    }

    try {
      const res = await fetch(`/api/people/${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { person?: PublicProfileDto };
        if (data.person?.id) {
          return dtoToCard(data.person, viewerId, undefined, connection);
        }
      }
    } catch {
      // fall through to local
    }
  }

  const local = getPublicProfileCard(userId, viewerId);
  if (!local) return null;
  return {
    ...local,
    connectionStatus: statusFromConnection(viewerId, userId, connection),
  };
}

export function buildCreatorMap(
  userIds: string[],
): Map<string, { name: string; avatar?: string | null; rating?: number | null }> {
  const map = new Map<
    string,
    { name: string; avatar?: string | null; rating?: number | null }
  >();
  const profiles = readLocalProfiles();
  for (const id of userIds) {
    const p = profiles.find((x) => x.id === id);
    if (!p) continue;
    map.set(id, {
      name:
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        p.display_name ||
        "Member",
      avatar: p.avatar_url,
      rating: null,
    });
  }
  return map;
}

/**
 * Resolve creator/member display names from the shared people API.
 */
export async function buildCreatorMapAsync(
  userIds: string[],
): Promise<
  Map<string, { name: string; avatar?: string | null; rating?: number | null }>
> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = buildCreatorMap(unique);
  if (unique.length === 0) return map;

  const missing = unique.filter((id) => !map.has(id));
  if (missing.length === 0) return map;

  const people = await fetchPublicProfiles({ ids: missing });
  for (const p of people) {
    map.set(p.id, {
      name: p.name,
      avatar: p.avatarUrl,
      rating: null,
    });
  }
  return map;
}
