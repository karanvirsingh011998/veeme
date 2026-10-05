import { registerUserInDatabase } from "@/lib/auth/db-auth";
import type { SignupDraft } from "@/lib/auth/signup-draft";

export type CompleteProfileResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Persists signup profile after OTP into the database.
 */
export async function completeSignupProfile(
  draft: SignupDraft,
): Promise<CompleteProfileResult> {
  const result = await registerUserInDatabase(draft);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, userId: result.profile.id };
}