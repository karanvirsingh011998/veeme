import { createClient } from "@/lib/supabase/client";
import type { SignupDraft } from "@/lib/auth/signup-draft";
import type { ProfileUpdate } from "@/types/database";

export type CompleteProfileResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persists signup profile fields after OTP verification.
 */
export async function completeSignupProfile(
  draft: SignupDraft,
): Promise<CompleteProfileResult> {
  const supabase = createClient();

  const payload: ProfileUpdate = {
    first_name: draft.firstName.trim(),
    last_name: draft.lastName.trim(),
    email: draft.email.trim().toLowerCase(),
    gender: draft.gender,
    country_code: draft.countryCode,
    phone_number: draft.phoneNumber,
    display_name: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
    phone_verified_at: new Date().toISOString(),
  };

  if (!supabase) {
    return { ok: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Dev OTP flow may run before Supabase Auth session exists.
    return { ok: true };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    ...payload,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}