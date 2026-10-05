import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/auth/config";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: "development" });
  }

  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true, mode: "supabase" });
}