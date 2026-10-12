import { listStoredCommunities } from "@/lib/communities/store";
import { isSupabaseConfigured } from "@/lib/auth/config";
import {
  addStoredComment,
  listStoredComments,
  listStoredMoments,
  readLikedMomentIds,
  toggleStoredLike,
  upsertStoredMoment,
} from "./store";
import type { CreateMomentInput, Moment, MomentComment } from "./types";

function useRemote() {
  return typeof window !== "undefined" && isSupabaseConfigured();
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function photoUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() || "";
  if (!trimmed) return null;
  if (!/^https:\/\/.+/i.test(trimmed)) return null;
  return trimmed;
}

export async function listMoments(): Promise<Moment[]> {
  if (useRemote()) {
    const res = await fetch("/api/moments");
    if (!res.ok) return [];
    const data = (await res.json()) as { moments?: Moment[] };
    return data.moments || [];
  }
  return listStoredMoments();
}

export function likedMomentIds(): string[] {
  return readLikedMomentIds();
}

export function toggleMomentLike(momentId: string): boolean {
  return toggleStoredLike(momentId);
}

export async function createMoment(
  input: CreateMomentInput,
): Promise<{ ok: true; moment: Moment } | { ok: false; error: string }> {
  const body = input.body.trim();
  if (!body) return { ok: false, error: "Write a short moment." };
  if (body.length > 300) return { ok: false, error: "Keep it under 300 characters." };
  const image = input.imageUrl?.trim() || "";
  if (image && !/^https:\/\/.+/i.test(image)) {
    return { ok: false, error: "Photo links need to start with https://." };
  }
  if (input.audience === "community" && !input.communityId) {
    return { ok: false, error: "Choose one of your communities." };
  }

  const payload: CreateMomentInput = {
    ...input,
    body,
    imageUrl: photoUrl(image),
    communityId: input.audience === "community" ? input.communityId : null,
  };

  if (useRemote()) {
    const res = await fetch("/api/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { moment?: Moment; error?: string };
    if (!res.ok || !data.moment) {
      return { ok: false, error: data.error || "Could not share that moment." };
    }
    return { ok: true, moment: data.moment };
  }

  const owned =
    input.audience === "community"
      ? listStoredCommunities(input.authorId).find((item) => item.id === input.communityId)
      : null;
  if (input.audience === "community" && !owned) {
    return { ok: false, error: "You can only post to a community you created." };
  }

  const moment: Moment = {
    id: newId("moment"),
    authorId: input.authorId,
    authorName: input.authorName || "You",
    audience: input.audience,
    communityId: payload.communityId ?? null,
    communityName: owned?.name ?? null,
    body,
    imageUrl: payload.imageUrl ?? null,
    likeCount: 0,
    createdAt: new Date().toISOString(),
  };
  upsertStoredMoment(moment);
  return { ok: true, moment };
}

export async function listMomentComments(momentId: string): Promise<MomentComment[]> {
  if (useRemote()) {
    const res = await fetch(`/api/moments/${momentId}/comments`);
    if (!res.ok) return [];
    const data = (await res.json()) as { comments?: MomentComment[] };
    return data.comments || [];
  }
  return listStoredComments(momentId);
}

export async function addMomentComment(input: {
  momentId: string;
  authorId: string;
  authorName: string;
  body: string;
}): Promise<{ ok: true; comment: MomentComment } | { ok: false; error: string }> {
  const body = input.body.trim();
  if (!body) return { ok: false, error: "Write a comment." };
  if (body.length > 300) return { ok: false, error: "Keep the comment under 300 characters." };
  if (useRemote()) {
    const res = await fetch(`/api/moments/${input.momentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, body }),
    });
    const data = (await res.json()) as { comment?: MomentComment; error?: string };
    if (!res.ok || !data.comment) {
      return { ok: false, error: data.error || "Could not add that comment." };
    }
    return { ok: true, comment: data.comment };
  }
  const comment: MomentComment = {
    id: newId("comment"),
    momentId: input.momentId,
    authorId: input.authorId,
    authorName: input.authorName || "You",
    body,
    createdAt: new Date().toISOString(),
  };
  addStoredComment(comment);
  return { ok: true, comment };
}
