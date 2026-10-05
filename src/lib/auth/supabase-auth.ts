import { buildFullPhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

export type SupabaseOtpResult =
  | { ok: true; fullPhoneNumber: string }
  | { ok: false; error: string };

/**
 * Request SMS OTP via Supabase Auth (server).
 */
export async function requestSupabaseOtp(
  countryCode: string,
  phoneNumber: string,
): Promise<SupabaseOtpResult> {
  const fullPhoneNumber = buildFullPhoneNumber(countryCode, phoneNumber);
  const supabase = await createClient();

  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { error } = await supabase.auth.signInWithOtp({ phone: fullPhoneNumber });
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, fullPhoneNumber };
}

/**
 * Verify SMS OTP via Supabase Auth (server).
 */
export async function verifySupabaseOtp(
  countryCode: string,
  phoneNumber: string,
  otp: string,
): Promise<SupabaseOtpResult> {
  const fullPhoneNumber = buildFullPhoneNumber(countryCode, phoneNumber);
  const supabase = await createClient();

  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { error } = await supabase.auth.verifyOtp({
    phone: fullPhoneNumber,
    token: otp.replace(/\D/g, ""),
    type: "sms",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, fullPhoneNumber };
}