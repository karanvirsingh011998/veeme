import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SignupDraft } from "@/lib/auth/signup-draft";

type CompleteSignupBody = SignupDraft;

/**
 * Persists signup profile fields after OTP (requires Supabase auth session).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as CompleteSignupBody;
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ ok: true, dev: true });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated." },
      { status: 401 },
    );
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    first_name: body.firstName.trim(),
    last_name: body.lastName.trim(),
    email: body.email.trim().toLowerCase(),
    gender: body.gender,
    country_code: body.countryCode,
    phone_number: body.phoneNumber,
    display_name: `${body.firstName.trim()} ${body.lastName.trim()}`.trim(),
    phone_verified_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}