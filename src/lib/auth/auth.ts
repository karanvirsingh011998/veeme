/**
 * Client-facing authentication API.
 * UI calls these helpers — never implements OTP or Supabase details directly.
 */

export type OtpMode = "signup" | "login";

export type RequestOtpResult =
  | { ok: true; fullPhoneNumber: string }
  | { ok: false; error: string };

export type VerifyOtpResult =
  | { ok: true; fullPhoneNumber: string }
  | { ok: false; error: string };

export type AuthUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  countryCode: string;
  phoneNumber: string;
};

export type PublicAuthConfig = {
  mode: "supabase" | "development";
  phoneAuthMode: "supabase" | "development";
  otpLength: number;
  showDevIndicator: boolean;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

/**
 * Fetch safe auth config (mode + OTP length, never the OTP value).
 */
export async function getAuthConfig(): Promise<PublicAuthConfig> {
  const response = await fetch("/api/auth/config", { cache: "no-store" });
  if (!response.ok) {
    return {
      mode: "development",
      phoneAuthMode: "development",
      otpLength: 4,
      showDevIndicator: true,
    };
  }
  return parseJson<PublicAuthConfig>(response);
}

/**
 * Request an OTP for the given country code + national number.
 */
export async function requestOtp(
  countryCode: string,
  phoneNumber: string,
): Promise<RequestOtpResult> {
  const response = await fetch("/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ countryCode, phoneNumber }),
  });
  return parseJson<RequestOtpResult>(response);
}

/**
 * Verify OTP only (does not touch the database).
 */
export async function verifyOtp(
  countryCode: string,
  phoneNumber: string,
  otp: string,
): Promise<VerifyOtpResult> {
  const response = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ countryCode, phoneNumber, otp }),
  });
  return parseJson<VerifyOtpResult>(response);
}

/**
 * Current user from local session (populated after DB login/signup).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (typeof window === "undefined") return null;

  const { readAuthSession } = await import("@/lib/auth/session");
  const session = readAuthSession();
  if (!session) return null;

  return {
    id: session.id || `pending-${session.countryCode}-${session.phoneNumber}`,
    firstName: session.firstName,
    lastName: session.lastName,
    email: session.email,
    gender: session.gender,
    countryCode: session.countryCode,
    phoneNumber: session.phoneNumber,
  };
}

/**
 * Sign out — clears local session state.
 */
export async function signOut(): Promise<void> {
  const { clearAuthSession } = await import("@/lib/auth/session");
  clearAuthSession();

  try {
    await fetch("/api/auth/sign-out", { method: "POST" });
  } catch {
    // Local clear is enough when offline.
  }
}