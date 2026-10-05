import { isSupabaseConfigured } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";
import { getDevProfile, listDevProfiles } from "@/lib/profile/dev-store";
import type { ProfileRow } from "@/types/database";

export type AdminUserRow = ProfileRow & {
  is_admin?: boolean;
};

/**
 * Lists users for the admin directory (server-side only).
 */
export async function listAdminUsers(): Promise<AdminUserRow[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];
    return data as AdminUserRow[];
  }

  return listDevProfiles() as Promise<AdminUserRow[]>;
}

export async function getAdminUser(id: string): Promise<AdminUserRow | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as AdminUserRow | null) ?? null;
  }

  return getDevProfile(id) as Promise<AdminUserRow | null>;
}