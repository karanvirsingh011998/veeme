import { buildFullPhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";
import { DEV_OTP } from "@/lib/auth/constants";

export type OtpMode = "signup" | "login";

export type RequestOtpResult =
  | { ok: true; fullPhoneNumber: string }
  | { ok: false; error: string };

export type VerifyOtpResult =
  | { ok: true; fullPhoneNumber: string }
  | { ok: false; error: string };

/**
 * Requests an OTP for the given country code and national number.
 * Uses Supabase when configured; otherwise succeeds for local dev flow.
 */
export async function requestOtp(
  countryCode: string,
  phoneNumber: string,
): Promise<RequestOtpResult> {
  const fullPhoneNumber = buildFullPhoneNumber(countryCode, phoneNumber);

  const supabase = createClient();
  if (supabase) {
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhoneNumber });
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true, fullPhoneNumber };
}

/**
 * Verifies OTP. Accepts dev code `66666` when Supabase is not configured or
 * alongside real Supabase verification when env is present.
 */
export async function verifyOtp(
  countryCode: string,
  phoneNumber: string,
  otp: string,
): Promise<VerifyOtpResult> {
  const trimmedOtp = otp.replace(/\D/g, "");
  const fullPhoneNumber = buildFullPhoneNumber(countryCode, phoneNumber);

  const supabase = createClient();

  if (trimmedOtp === DEV_OTP) {
    return { ok: true, fullPhoneNumber };
  }

  if (!supabase) {
    return { ok: false, error: "Invalid code. For development, use 66666." };
  }

  const { error } = await supabase.auth.verifyOtp({
    phone: fullPhoneNumber,
    token: trimmedOtp,
    type: "sms",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, fullPhoneNumber };
}