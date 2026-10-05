import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { upsertDevProfile } from "@/lib/profile/dev-store";
import type { ProfileRow } from "@/types/database";

/**
 * Development-only profile mirror for admin directory.
 * Disabled when Supabase is configured.
 */
export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const profile = (await request.json()) as ProfileRow;
  if (!profile?.id) {
    return NextResponse.json({ ok: false, error: "Invalid profile." }, { status: 400 });
  }

  await upsertDevProfile({
    ...profile,
    is_admin: false,
  } as ProfileRow & { is_admin?: boolean });

  return NextResponse.json({ ok: true });
}