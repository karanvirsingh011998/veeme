import { isSupabaseConfigured } from "@/lib/auth/config";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export { isSupabaseConfigured };

/**
 * Browser Supabase client. Returns null when env is not configured.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient<Database>(url, key);
}