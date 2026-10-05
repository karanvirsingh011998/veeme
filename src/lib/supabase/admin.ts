import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/auth/config";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client (server-only).
 * Used to create Auth users and write profiles during phone OTP signup/login.
 * Never import this into client components.
 */
export function createServiceClient() {
  if (!isSupabaseConfigured()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) return null;

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}