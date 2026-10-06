import { isSupabaseConfigured } from "@/lib/auth/config";
import { PROFILE_STORE_KEY } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";
import type { ProfileInsert, ProfileRow, ProfileUpdate } from "@/types/database";

export type ProfileInput = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
};

function toRow(input: ProfileInput): ProfileRow {
  const now = new Date().toISOString();
  return {
    id: input.id,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    gender: input.gender,
    country_code: input.countryCode,
    phone_number: input.phoneNumber,
    phone_verified_at: now,
    display_name: `${input.firstName} ${input.lastName}`.trim(),
    bio: null,
    city: null,
    avatar_url: null,
    account_status: "active",
    is_admin: false,
    created_at: now,
    updated_at: now,
  };
}

function readLocalStore(): Record<string, ProfileRow> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILE_STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ProfileRow>) : {};
  } catch {
    return {};
  }
}

function writeLocalStore(store: Record<string, ProfileRow>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(store));
}

/**
 * Create or upsert a profile (local store in dev, Supabase when configured).
 */
export async function createProfile(
  data: ProfileInput,
): Promise<{ ok: true; profile: ProfileRow } | { ok: false; error: string }> {
  const row = toRow(data);

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    if (!supabase) {
      return { ok: false, error: "Supabase client unavailable." };
    }
    const insert: ProfileInsert = {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      gender: row.gender,
      country_code: row.country_code,
      phone_number: row.phone_number,
      display_name: row.display_name,
      phone_verified_at: row.phone_verified_at,
    };
    const { data: saved, error } = await supabase
      .from("profiles")
      .upsert(insert)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, profile: saved };
  }

  const store = readLocalStore();
  store[row.id] = row;
  writeLocalStore(store);

  try {
    await fetch("/api/dev/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
  } catch {
    // Local profile still works if mirror fails.
  }

  return { ok: true, profile: row };
}

export async function getProfile(
  userId: string,
): Promise<ProfileRow | null> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return data;
  }

  return readLocalStore()[userId] ?? null;
}

export type ProfileExtras = {
  bio?: string | null;
  city?: string | null;
};

export async function updateProfile(
  userId: string,
  data: Partial<ProfileInput> & ProfileExtras,
): Promise<{ ok: true; profile: ProfileRow } | { ok: false; error: string }> {
  const patch: ProfileUpdate = {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    gender: data.gender,
    country_code: data.countryCode,
    phone_number: data.phoneNumber,
    bio: data.bio,
    city: data.city,
    updated_at: new Date().toISOString(),
  };

  if (data.firstName || data.lastName) {
    const existing = await getProfile(userId);
    const first = data.firstName ?? existing?.first_name ?? "";
    const last = data.lastName ?? existing?.last_name ?? "";
    patch.display_name = `${first} ${last}`.trim();
  }

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    if (!supabase) return { ok: false, error: "Supabase client unavailable." };
    const { data: saved, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, profile: saved };
  }

  const store = readLocalStore();
  const current = store[userId];
  if (!current) return { ok: false, error: "Profile not found." };
  const next: ProfileRow = {
    ...current,
    first_name: patch.first_name ?? current.first_name,
    last_name: patch.last_name ?? current.last_name,
    email: patch.email ?? current.email,
    gender: patch.gender ?? current.gender,
    country_code: patch.country_code ?? current.country_code,
    phone_number: patch.phone_number ?? current.phone_number,
    display_name: patch.display_name ?? current.display_name,
    bio: patch.bio !== undefined ? patch.bio : current.bio,
    city: patch.city !== undefined ? patch.city : current.city,
    updated_at: patch.updated_at ?? current.updated_at,
  };
  store[userId] = next;
  writeLocalStore(store);
  return { ok: true, profile: next };
}

export async function findProfileByPhone(
  countryCode: string,
  phoneNumber: string,
): Promise<ProfileRow | null> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("country_code", countryCode)
      .eq("phone_number", phoneNumber)
      .maybeSingle();
    return data;
  }

  const store = readLocalStore();
  return (
    Object.values(store).find(
      (p) => p.country_code === countryCode && p.phone_number === phoneNumber,
    ) ?? null
  );
}