import { buildFullPhoneNumber } from "@/lib/phone";
import { getDevOtp } from "@/lib/auth/config";

export type DevOtpResult =
  | { ok: true; fullPhoneNumber: string }
  | { ok: false; error: string };

/**
 * Development OTP request — always succeeds (no SMS in local mode).
 */
export function requestDevOtp(
  countryCode: string,
  phoneNumber: string,
): DevOtpResult {
  return {
    ok: true,
    fullPhoneNumber: buildFullPhoneNumber(countryCode, phoneNumber),
  };
}

/**
 * Verifies against VEMEE_DEV_OTP (server-only).
 */
export function verifyDevOtp(
  countryCode: string,
  phoneNumber: string,
  otp: string,
): DevOtpResult {
  const expected = getDevOtp();
  const trimmed = otp.replace(/\D/g, "");
  const fullPhoneNumber = buildFullPhoneNumber(countryCode, phoneNumber);

  if (trimmed === expected) {
    return { ok: true, fullPhoneNumber };
  }

  return {
    ok: false,
    error: `Invalid code. For development, use the ${expected.length}-digit development OTP.`,
  };
}