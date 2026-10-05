import { isSupabaseConfigured } from "@/lib/auth/config";
import {
  getAdminCookieName,
  getAdminCookieOptions,
  parseAdminSession,
  serializeAdminSession,
  type AdminSessionPayload,
} from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export type AdminAuthResult =
  | { ok: true; email: string; userId: string }
  | { ok: false; error: string };

const GENERIC_AUTH_ERROR = "Invalid email or password.";
const GENERIC_ACCESS_ERROR = "You do not have access to the admin area.";

function getDevAdminCredentials() {
  return {
    email: (process.env.VEMEE_ADMIN_EMAIL || "").trim().toLowerCase(),
    password: (process.env.VEMEE_ADMIN_PASSWORD || "").trim(),
  };
}

/**
 * Authenticates an admin with email/password.
 * 1) Env bootstrap (VEMEE_ADMIN_EMAIL / VEMEE_ADMIN_PASSWORD) when configured
 * 2) Supabase Auth + profiles.is_admin when keys are set
 * Never reveals whether an email is an admin account.
 */
export async function signInAdmin(
  emailRaw: string,
  password: string,
): Promise<AdminAuthResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) {
    return { ok: false, error: GENERIC_AUTH_ERROR };
  }

  const creds = getDevAdminCredentials();

  // Env-based admin works on local and Vercel when these vars are set.
  if (creds.email && creds.password && email === creds.email) {
    return signInAdminWithDev(email, password);
  }

  if (isSupabaseConfigured()) {
    return signInAdminWithSupabase(email, password);
  }

  return signInAdminWithDev(email, password);
}

async function signInAdminWithDev(
  email: string,
  password: string,
): Promise<AdminAuthResult> {
  const creds = getDevAdminCredentials();
  if (!creds.email || !creds.password) {
    return {
      ok: false,
      error:
        "Admin login is not configured. Set VEMEE_ADMIN_EMAIL and VEMEE_ADMIN_PASSWORD.",
    };
  }

  if (email !== creds.email || password !== creds.password) {
    return { ok: false, error: GENERIC_AUTH_ERROR };
  }

  const cookieStore = await cookies();
  const token = await serializeAdminSession({
    sub: "dev-admin",
    email,
    mode: "development",
  });
  cookieStore.set(getAdminCookieName(), token, getAdminCookieOptions());

  return { ok: true, email, userId: "dev-admin" };
}

async function signInAdminWithSupabase(
  email: string,
  password: string,
): Promise<AdminAuthResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: GENERIC_AUTH_ERROR };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: GENERIC_AUTH_ERROR };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, is_admin, account_status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.account_status !== "active" || !profile.is_admin) {
    await supabase.auth.signOut();
    return { ok: false, error: GENERIC_ACCESS_ERROR };
  }

  const cookieStore = await cookies();
  const token = await serializeAdminSession({
    sub: data.user.id,
    email: (profile.email || email).toLowerCase(),
    mode: "supabase",
  });
  cookieStore.set(getAdminCookieName(), token, getAdminCookieOptions());

  return { ok: true, email: (profile.email || email).toLowerCase(), userId: data.user.id };
}

/**
 * Ends admin session (cookie + Supabase auth when present).
 */
export async function signOutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(getAdminCookieName(), "", {
    ...getAdminCookieOptions(),
    maxAge: 0,
  });

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
}

/**
 * Server-side admin session resolution. Never trusts client role claims alone.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const cookieSession = await parseAdminSession(
    cookieStore.get(getAdminCookieName())?.value,
  );

  // Prefer verified admin cookie from env bootstrap.
  if (cookieSession?.isAdmin && cookieSession.mode === "development") {
    return cookieSession;
  }

  if (!isSupabaseConfigured()) {
    return cookieSession?.isAdmin ? cookieSession : null;
  }

  const supabase = await createClient();
  if (!supabase) {
    return cookieSession?.isAdmin ? cookieSession : null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return cookieSession?.isAdmin ? cookieSession : null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, is_admin, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin || profile.account_status !== "active") {
    return null;
  }

  return {
    sub: user.id,
    email: (profile.email || user.email || "").toLowerCase(),
    isAdmin: true,
    mode: "supabase",
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
}

/**
 * Require admin for server components / route handlers.
 */
export async function requireAdmin(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requestAdminPasswordReset(
  emailRaw: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: "Enter your email address." };
  }

  // Always return success-shaped response to avoid account enumeration
  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: true };

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/login`;
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return { ok: true };
}