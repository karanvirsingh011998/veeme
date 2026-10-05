/**
 * Auth / Supabase configuration helpers.
 * Never expose service-role keys; never hardcode OTPs in UI.
 */

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

/**
 * Real Supabase SMS OTP is opt-in.
 * Having URL/anon key alone is not enough — phone provider must be configured
 * in the Supabase dashboard AND this flag must be true.
 */
export function isSupabasePhoneOtpEnabled(): boolean {
  return (
    isSupabaseConfigured() &&
    process.env.VEMEE_USE_SUPABASE_PHONE_OTP === "true"
  );
}

/**
 * Development OTP from server env. Defaults to 6666.
 * Only call from server code (API routes / server components).
 */
export function getDevOtp(): string {
  return (process.env.VEMEE_DEV_OTP || "6666").replace(/\D/g, "") || "6666";
}

export function getAuthMode(): "supabase" | "development" {
  return isSupabaseConfigured() ? "supabase" : "development";
}

/** Phone login/signup OTP path (independent of DB/admin Supabase usage). */
export function getPhoneAuthMode(): "supabase" | "development" {
  return isSupabasePhoneOtpEnabled() ? "supabase" : "development";
}

export type PublicAuthConfig = {
  mode: "supabase" | "development";
  phoneAuthMode: "supabase" | "development";
  otpLength: number;
  showDevIndicator: boolean;
};

/**
 * Safe config for the client — never includes the OTP value.
 */
export function getPublicAuthConfig(): PublicAuthConfig {
  const phoneAuthMode = getPhoneAuthMode();
  return {
    mode: getAuthMode(),
    phoneAuthMode,
    otpLength: getDevOtp().length,
    showDevIndicator:
      phoneAuthMode === "development" && process.env.NODE_ENV !== "production",
  };
}